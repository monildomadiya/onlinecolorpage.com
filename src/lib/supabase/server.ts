import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { serverEnv } from '@/lib/env';

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Reads the auth cookies so RLS sees the signed-in user.
 *
 * Server Components cannot write cookies; the `setAll` below is wrapped in a
 * try/catch for exactly that case. Token refresh happens in middleware.ts.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(serverEnv.supabaseUrl, serverEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component - middleware already refreshed it.
        }
      },
    },
  });
}
