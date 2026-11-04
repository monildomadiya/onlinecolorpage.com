import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { serverEnv } from '@/lib/env';

let cached: SupabaseClient | null = null;

/**
 * Service-role Supabase client. Bypasses RLS, so it must never be imported
 * into a client component or handed to the browser. Every admin mutation goes
 * through here *after* `requireStaff()` has verified the caller.
 */
export function createAdminClient(): SupabaseClient {
  if (cached) return cached;

  cached = createSupabaseClient(serverEnv.supabaseUrl, serverEnv.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'X-Client-Info': 'onlinecolorpage-admin' } },
  });

  return cached;
}
