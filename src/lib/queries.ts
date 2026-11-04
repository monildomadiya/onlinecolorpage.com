import { cache } from 'react';
import { createPublicClient } from '@/lib/supabase/public';
import { isSupabaseConfigured } from '@/lib/env';
import type { Category, ColoringPageWithCategory, Difficulty } from '@/types/db';

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

export type SortOption = 'newest' | 'popular' | 'most_colored' | 'az';

export interface PageQuery {
  categorySlug?: string;
  categoryId?: string;
  q?: string;
  tag?: string;
  difficulty?: Difficulty;
  featured?: boolean;
  sort?: SortOption;
  page?: number;
  perPage?: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

/* ------------------------------------------------------------------ */
/*  categories                                                         */
/* ------------------------------------------------------------------ */

export const getCategories = cache(async (): Promise<Category[]> => {
  if (!isSupabaseConfigured) return [];

  const supabase = createPublicClient();
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  return (data ?? []) as Category[];
});

/** Categories plus how many published pages each one holds. */
export const getCategoriesWithCounts = cache(
  async (): Promise<(Category & { page_count: number })[]> => {
    if (!isSupabaseConfigured) return [];

    const supabase = createPublicClient();
    const [{ data: categories }, { data: pages }] = await Promise.all([
      supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase.from('coloring_pages').select('category_id').eq('is_published', true),
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
  },
);

export const getCategoryBySlug = cache(async (slug: string): Promise<Category | null> => {
  if (!isSupabaseConfigured) return null;

  const supabase = createPublicClient();
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  return (data as Category) ?? null;
});

/* ------------------------------------------------------------------ */
/*  coloring pages                                                     */
/* ------------------------------------------------------------------ */

export async function getPages(query: PageQuery = {}): Promise<PagedResult<ColoringPageWithCategory>> {
  const page = Math.max(1, query.page ?? 1);
  const perPage = Math.min(Math.max(query.perPage ?? 24, 1), 96);
  const empty: PagedResult<ColoringPageWithCategory> = {
    items: [],
    total: 0,
    page,
    perPage,
    totalPages: 0,
  };

  if (!isSupabaseConfigured) return empty;

  const supabase = createPublicClient();

  let categoryId = query.categoryId;
  if (!categoryId && query.categorySlug) {
    const category = await getCategoryBySlug(query.categorySlug);
    if (!category) return empty;
    categoryId = category.id;
  }

  let builder = supabase
    .from('coloring_pages')
    .select(PAGE_SELECT, { count: 'exact' })
    .eq('is_published', true);

  if (categoryId) builder = builder.eq('category_id', categoryId);
  if (query.difficulty) builder = builder.eq('difficulty', query.difficulty);
  if (query.featured) builder = builder.eq('is_featured', true);
  if (query.tag) builder = builder.contains('tags', [query.tag.toLowerCase()]);

  if (query.q?.trim()) {
    const term = query.q.trim().replace(/[%,()]/g, ' ').slice(0, 80);
    builder = builder.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
  }

  switch (query.sort ?? 'newest') {
    case 'popular':
      builder = builder.order('view_count', { ascending: false });
      break;
    case 'most_colored':
      builder = builder.order('color_count', { ascending: false });
      break;
    case 'az':
      builder = builder.order('title', { ascending: true });
      break;
    default:
      builder = builder.order('published_at', { ascending: false, nullsFirst: false });
  }

  const from = (page - 1) * perPage;
  const { data, count, error } = await builder.range(from, from + perPage - 1);

  if (error) return empty;

  const total = count ?? 0;
  return {
    items: (data ?? []) as unknown as ColoringPageWithCategory[],
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export const getPageBySlug = cache(
  async (slug: string): Promise<ColoringPageWithCategory | null> => {
    if (!isSupabaseConfigured) return null;

    const supabase = createPublicClient();
    const { data } = await supabase
      .from('coloring_pages')
      .select(PAGE_SELECT)
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    return (data as unknown as ColoringPageWithCategory) ?? null;
  },
);

/** Same category first, then anything sharing a tag. */
export async function getRelatedPages(
  page: ColoringPageWithCategory,
  limit = 12,
): Promise<ColoringPageWithCategory[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = createPublicClient();
  const collected = new Map<string, ColoringPageWithCategory>();

  if (page.category_id) {
    const { data } = await supabase
      .from('coloring_pages')
      .select(PAGE_SELECT)
      .eq('is_published', true)
      .eq('category_id', page.category_id)
      .neq('id', page.id)
      .order('view_count', { ascending: false })
      .limit(limit);

    for (const row of (data ?? []) as unknown as ColoringPageWithCategory[]) {
      collected.set(row.id, row);
    }
  }

  if (collected.size < limit && page.tags.length > 0) {
    const { data } = await supabase
      .from('coloring_pages')
      .select(PAGE_SELECT)
      .eq('is_published', true)
      .overlaps('tags', page.tags)
      .neq('id', page.id)
      .limit(limit);

    for (const row of (data ?? []) as unknown as ColoringPageWithCategory[]) {
      if (collected.size >= limit) break;
      collected.set(row.id, row);
    }
  }

  return Array.from(collected.values()).slice(0, limit);
}

export async function getFeaturedPages(limit = 8) {
  return (await getPages({ featured: true, sort: 'newest', perPage: limit })).items;
}

export async function getPopularPages(limit = 12) {
  return (await getPages({ sort: 'popular', perPage: limit })).items;
}

export async function getNewestPages(limit = 24) {
  return (await getPages({ sort: 'newest', perPage: limit })).items;
}

/** Every published tag with a usage count, for the tag cloud and filters. */
export const getPopularTags = cache(async (limit = 40): Promise<{ tag: string; count: number }[]> => {
  if (!isSupabaseConfigured) return [];

  const supabase = createPublicClient();
  const { data } = await supabase.from('coloring_pages').select('tags').eq('is_published', true);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    for (const tag of (row.tags ?? []) as string[]) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, limit);
});

/** Slim rows for sitemap.xml. */
export async function getSitemapEntries() {
  if (!isSupabaseConfigured) return { pages: [], categories: [] };

  const supabase = createPublicClient();
  const [{ data: pages }, { data: categories }] = await Promise.all([
    supabase
      .from('coloring_pages')
      .select('slug, updated_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(45000),
    supabase.from('categories').select('slug, updated_at').eq('is_active', true),
  ]);

  return {
    pages: (pages ?? []) as { slug: string; updated_at: string }[],
    categories: (categories ?? []) as { slug: string; updated_at: string }[],
  };
}
