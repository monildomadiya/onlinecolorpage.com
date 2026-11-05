import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseAdminConfigured } from '@/lib/env';
import type {
  AdSlot,
  AdminStats,
  Category,
  ColoringPage,
  ColoringPageWithCategory,
  DailyPoint,
  MediaItem,
  Profile,
} from '@/types/db';

const PAGE_SELECT = `
  id, slug, title, description, category_id,
  image_key, thumb_key, pdf_key, reference_key,
  width, height, file_size,
  difficulty, age_min, age_max, tags, suggested_colors,
  is_published, is_featured, allow_online_color, allow_download,
  view_count, download_count, color_count, like_count,
  seo_title, seo_description,
  published_at, created_at, updated_at,
  category:categories ( id, slug, name, emoji, color )
`;

export const EMPTY_STATS: AdminStats = {
  pages_total: 0,
  pages_published: 0,
  pages_draft: 0,
  categories_total: 0,
  media_total: 0,
  storage_bytes: 0,
  views_total: 0,
  downloads_total: 0,
  colorings_total: 0,
  views_7d: 0,
  downloads_7d: 0,
  colorings_7d: 0,
};

/**
 * A page renders alongside its layout, so these run even when the layout is
 * about to replace the whole area with <SetupRequired />. Bailing out keeps
 * that screen from being pre-empted by a 500 thrown down here.
 */
export async function getAdminStats(): Promise<AdminStats> {
  if (!isSupabaseAdminConfigured) return EMPTY_STATS;

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc('admin_stats');

  if (error || !data) {
    console.warn('[admin] admin_stats failed', error?.message);
    return EMPTY_STATS;
  }

  return { ...EMPTY_STATS, ...(data as AdminStats) };
}

export async function getEventsDaily(days = 30): Promise<DailyPoint[]> {
  if (!isSupabaseAdminConfigured) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc('events_daily', { p_days: days });

  if (error || !data) {
    console.warn('[admin] events_daily failed', error?.message);
    return [];
  }

  return (data as DailyPoint[]).map((row) => ({
    day: row.day,
    views: Number(row.views ?? 0),
    downloads: Number(row.downloads ?? 0),
    colorings: Number(row.colorings ?? 0),
  }));
}

/* ------------------------------------------------------------------ */
/*  coloring pages                                                     */
/* ------------------------------------------------------------------ */

export type PageStatus = 'all' | 'published' | 'draft' | 'featured';
export type AdminSort = 'newest' | 'oldest' | 'title' | 'views' | 'downloads';

export interface AdminPageQuery {
  q?: string;
  categoryId?: string;
  status?: PageStatus;
  sort?: AdminSort;
  page?: number;
  perPage?: number;
}

export async function listPages(query: AdminPageQuery = {}) {
  const page = Math.max(1, query.page ?? 1);
  const perPage = Math.min(Math.max(query.perPage ?? 25, 1), 100);

  if (!isSupabaseAdminConfigured) {
    return { items: [], total: 0, page, perPage, totalPages: 0 };
  }

  const supabase = createAdminClient();
  let builder = supabase.from('coloring_pages').select(PAGE_SELECT, { count: 'exact' });

  if (query.categoryId) builder = builder.eq('category_id', query.categoryId);

  switch (query.status) {
    case 'published':
      builder = builder.eq('is_published', true);
      break;
    case 'draft':
      builder = builder.eq('is_published', false);
      break;
    case 'featured':
      builder = builder.eq('is_featured', true);
      break;
    default:
      break;
  }

  if (query.q?.trim()) {
    const term = query.q.trim().replace(/[%,()]/g, ' ').slice(0, 80);
    builder = builder.or(`title.ilike.%${term}%,slug.ilike.%${term}%`);
  }

  switch (query.sort ?? 'newest') {
    case 'oldest':
      builder = builder.order('created_at', { ascending: true });
      break;
    case 'title':
      builder = builder.order('title', { ascending: true });
      break;
    case 'views':
      builder = builder.order('view_count', { ascending: false });
      break;
    case 'downloads':
      builder = builder.order('download_count', { ascending: false });
      break;
    default:
      builder = builder.order('created_at', { ascending: false });
  }

  const from = (page - 1) * perPage;
  const { data, count, error } = await builder.range(from, from + perPage - 1);

  if (error) {
    console.warn('[admin] listPages failed', error.message);
    return { items: [], total: 0, page, perPage, totalPages: 0 };
  }

  const total = count ?? 0;
  return {
    items: (data ?? []) as unknown as ColoringPageWithCategory[],
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function getPageById(id: string): Promise<ColoringPage | null> {
  if (!isSupabaseAdminConfigured) return null;

  const supabase = createAdminClient();
  const { data } = await supabase.from('coloring_pages').select('*').eq('id', id).maybeSingle();
  return (data as ColoringPage) ?? null;
}

/* ------------------------------------------------------------------ */
/*  categories                                                         */
/* ------------------------------------------------------------------ */

/** All categories, active or not, with published-page counts. */
export async function listCategories(): Promise<(Category & { page_count: number })[]> {
  if (!isSupabaseAdminConfigured) return [];

  const supabase = createAdminClient();

  const [{ data: categories }, { data: pages }] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order').order('name'),
    supabase.from('coloring_pages').select('category_id'),
  ]);

  const counts = new Map<string, number>();
  for (const row of pages ?? []) {
    if (!row.category_id) continue;
    counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
  }

  return ((categories ?? []) as Category[]).map((c) => ({
    ...c,
    page_count: counts.get(c.id) ?? 0,
  }));
}

/* ------------------------------------------------------------------ */
/*  media                                                              */
/* ------------------------------------------------------------------ */

export async function listMedia(opts: { kind?: string; page?: number; perPage?: number } = {}) {
  const page = Math.max(1, opts.page ?? 1);
  const perPage = Math.min(Math.max(opts.perPage ?? 40, 1), 120);

  if (!isSupabaseAdminConfigured) {
    return { items: [], total: 0, page, perPage, totalPages: 0 };
  }

  const supabase = createAdminClient();
  let builder = supabase
    .from('media')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (opts.kind && opts.kind !== 'all') builder = builder.eq('kind', opts.kind);

  const from = (page - 1) * perPage;
  const { data, count } = await builder.range(from, from + perPage - 1);

  const total = count ?? 0;
  return {
    items: (data ?? []) as MediaItem[],
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

/* ------------------------------------------------------------------ */
/*  settings, ads, users                                               */
/* ------------------------------------------------------------------ */

export async function getRawSettings(): Promise<Record<string, Record<string, unknown>>> {
  if (!isSupabaseAdminConfigured) return {};

  const supabase = createAdminClient();
  const { data } = await supabase.from('settings').select('key, value');

  return Object.fromEntries(
    (data ?? []).map((row) => [row.key as string, (row.value ?? {}) as Record<string, unknown>]),
  );
}

export async function listAdSlots(): Promise<AdSlot[]> {
  if (!isSupabaseAdminConfigured) return [];

  const supabase = createAdminClient();
  const { data } = await supabase.from('ad_slots').select('*').order('slot_key');
  return (data ?? []) as AdSlot[];
}

export async function listProfiles(): Promise<Profile[]> {
  if (!isSupabaseAdminConfigured) return [];

  const supabase = createAdminClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('role', { ascending: true })
    .order('created_at', { ascending: false });
  return (data ?? []) as Profile[];
}

/* ------------------------------------------------------------------ */
/*  analytics breakdowns                                               */
/* ------------------------------------------------------------------ */

export async function getTopPages(limit = 10) {
  if (!isSupabaseAdminConfigured) return [];

  const supabase = createAdminClient();
  const { data } = await supabase
    .from('coloring_pages')
    .select('id, slug, title, thumb_key, image_key, view_count, download_count, color_count')
    .eq('is_published', true)
    .order('view_count', { ascending: false })
    .limit(limit);

  return (data ?? []) as Pick<
    ColoringPage,
    'id' | 'slug' | 'title' | 'thumb_key' | 'image_key' | 'view_count' | 'download_count' | 'color_count'
  >[];
}

/** Device and country splits over the last `days`, computed in one pass. */
export async function getAudienceSplit(days = 30) {
  if (!isSupabaseAdminConfigured) {
    return { devices: [], countries: [], events: [], total: 0 };
  }

  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const supabase = createAdminClient();
  const { data } = await supabase
    .from('page_events')
    .select('device, country, event_type')
    .gte('created_at', since)
    .limit(50_000);

  const devices = new Map<string, number>();
  const countries = new Map<string, number>();
  const events = new Map<string, number>();

  for (const row of data ?? []) {
    const device = (row.device as string) || 'unknown';
    devices.set(device, (devices.get(device) ?? 0) + 1);

    if (row.country) countries.set(row.country, (countries.get(row.country) ?? 0) + 1);

    const type = row.event_type as string;
    events.set(type, (events.get(type) ?? 0) + 1);
  }

  const sorted = (map: Map<string, number>) =>
    Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

  return {
    devices: sorted(devices),
    countries: sorted(countries).slice(0, 10),
    events: sorted(events),
    total: data?.length ?? 0,
  };
}
