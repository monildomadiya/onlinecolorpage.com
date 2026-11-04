import { cache } from 'react';
import { createPublicClient } from '@/lib/supabase/public';
import { isSupabaseConfigured, publicEnv } from '@/lib/env';
import type { AdSlot, AllSettings } from '@/types/db';

export const DEFAULT_SETTINGS: AllSettings = {
  site: {
    name: publicEnv.siteName,
    tagline: 'Free coloring pages kids actually love',
    description:
      'Thousands of free printable coloring pages plus a fun online coloring game. Color on your screen, download a PNG, or print the PDF - no sign-up needed.',
    email: 'hello@onlinecolorpage.com',
    logo_key: null,
    favicon_key: null,
  },
  home: {
    hero_title: 'Color. Play. Print!',
    hero_subtitle: 'Pick a picture, splash some color, and show the world your masterpiece.',
    hero_cta: 'Start Coloring',
    show_featured: true,
    show_popular: true,
    show_newest: true,
    grid_size: 24,
  },
  seo: {
    title_suffix: ' | Online Color Page',
    default_title: 'Free Printable & Online Coloring Pages for Kids',
    default_description:
      'Color online in your browser or print free coloring pages for kids. Animals, cartoons, vehicles, princesses and more - all free, all fun.',
    og_image_key: null,
    twitter: '',
    facebook: '',
    instagram: '',
    pinterest: '',
  },
  features: {
    sounds_default_on: true,
    confetti: true,
    rewards: true,
    guide_mode: true,
    allow_downloads: true,
    maintenance: false,
  },
  ads: {
    client: publicEnv.adsenseClient,
    enabled: Boolean(publicEnv.adsenseClient),
  },
};

/**
 * Loads every settings row and deep-merges it over the defaults, so a partially
 * filled settings table (or no Supabase at all) still renders a complete site.
 * `cache` dedupes this to one query per request.
 */
export const getSettings = cache(async (): Promise<AllSettings> => {
  if (!isSupabaseConfigured) return DEFAULT_SETTINGS;

  try {
    const supabase = createPublicClient();
    const { data } = await supabase.from('settings').select('key, value');

    const merged = structuredClone(DEFAULT_SETTINGS) as unknown as Record<
      string,
      Record<string, unknown>
    >;

    for (const row of data ?? []) {
      const key = row.key as keyof AllSettings;
      if (!(key in merged)) continue;
      const value = (row.value ?? {}) as Record<string, unknown>;
      for (const [k, v] of Object.entries(value)) {
        if (v !== null && v !== undefined && v !== '') merged[key][k] = v;
      }
    }

    const settings = merged as unknown as AllSettings;

    // An env-level AdSense client always wins - it is what the <script> uses.
    if (publicEnv.adsenseClient) {
      settings.ads.client = publicEnv.adsenseClient;
      settings.ads.enabled = true;
    }

    return settings;
  } catch {
    return DEFAULT_SETTINGS;
  }
});

/** Active ad slots keyed by slot_key, for <AdSlot /> to look up. */
export const getAdSlots = cache(async (): Promise<Record<string, AdSlot>> => {
  if (!isSupabaseConfigured) return {};

  try {
    const supabase = createPublicClient();
    const { data } = await supabase.from('ad_slots').select('*').eq('is_active', true);
    return Object.fromEntries((data ?? []).map((slot) => [slot.slot_key, slot as AdSlot]));
  } catch {
    return {};
  }
});
