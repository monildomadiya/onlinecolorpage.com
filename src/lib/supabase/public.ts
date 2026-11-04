import { createClient as create, type SupabaseClient } from '@supabase/supabase-js';
import { publicEnv } from '@/lib/env';

let cached: SupabaseClient | null = null;

/**
 * Anon-key Supabase client with no cookie access.
 *
 * Public pages read through this one on purpose: touching `cookies()` would
 * opt every listing page out of static rendering and ISR. RLS already limits
 * the anon role to published rows, so there is nothing a session would add.
 */
export function createPublicClient(): SupabaseClient {
  if (cached) return cached;

  cached = create(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'X-Client-Info': 'onlinecolorpage-public' } },
  });

  return cached;
}
