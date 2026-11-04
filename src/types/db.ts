/** Hand-written row types for the Supabase schema in supabase/migrations. */

export type Role = 'admin' | 'editor' | 'viewer';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type MediaKind = 'image' | 'thumb' | 'pdf' | 'other';
export type Device = 'mobile' | 'tablet' | 'desktop' | 'unknown';

export type EventType =
  | 'view'
  | 'download_png'
  | 'download_pdf'
  | 'print'
  | 'color_start'
  | 'color_finish'
  | 'like';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  last_seen_at: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  emoji: string | null;
  color: string | null;
  cover_key: string | null;
  sort_order: number;
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ColoringPage {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category_id: string | null;

  image_key: string;
  thumb_key: string | null;
  pdf_key: string | null;
  reference_key: string | null;

  width: number | null;
  height: number | null;
  file_size: number | null;

  difficulty: Difficulty;
  age_min: number;
  age_max: number;
  tags: string[];
  suggested_colors: string[];

  is_published: boolean;
  is_featured: boolean;
  allow_online_color: boolean;
  allow_download: boolean;

  view_count: number;
  download_count: number;
  color_count: number;
  like_count: number;

  seo_title: string | null;
  seo_description: string | null;

  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/** A page joined with its category, which is what every list view needs. */
export interface ColoringPageWithCategory extends ColoringPage {
  category: Pick<Category, 'id' | 'slug' | 'name' | 'emoji' | 'color'> | null;
}

export interface MediaItem {
  id: string;
  key: string;
  kind: MediaKind;
  mime_type: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  original_name: string | null;
  page_id: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface AdSlot {
  id: string;
  slot_key: string;
  name: string;
  code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PageEvent {
  id: number;
  page_id: string | null;
  event_type: EventType;
  path: string | null;
  referrer: string | null;
  country: string | null;
  device: Device | null;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  settings                                                           */
/* ------------------------------------------------------------------ */

export interface SiteSettings {
  name: string;
  tagline: string;
  description: string;
  email: string;
  logo_key: string | null;
  favicon_key: string | null;
}

export interface HomeSettings {
  hero_title: string;
  hero_subtitle: string;
  hero_cta: string;
  show_featured: boolean;
  show_popular: boolean;
  show_newest: boolean;
  grid_size: number;
}

export interface SeoSettings {
  title_suffix: string;
  default_title: string;
  default_description: string;
  og_image_key: string | null;
  twitter: string;
  facebook: string;
  instagram: string;
  pinterest: string;
}

export interface FeatureSettings {
  sounds_default_on: boolean;
  confetti: boolean;
  rewards: boolean;
  guide_mode: boolean;
  allow_downloads: boolean;
  maintenance: boolean;
}

export interface AdsSettings {
  client: string;
  enabled: boolean;
}

export interface AllSettings {
  site: SiteSettings;
  home: HomeSettings;
  seo: SeoSettings;
  features: FeatureSettings;
  ads: AdsSettings;
}

export interface AdminStats {
  pages_total: number;
  pages_published: number;
  pages_draft: number;
  categories_total: number;
  media_total: number;
  storage_bytes: number;
  views_total: number;
  downloads_total: number;
  colorings_total: number;
  views_7d: number;
  downloads_7d: number;
  colorings_7d: number;
}

export interface DailyPoint {
  day: string;
  views: number;
  downloads: number;
  colorings: number;
}
