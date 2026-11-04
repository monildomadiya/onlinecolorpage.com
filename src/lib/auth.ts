import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { serverEnv } from '@/lib/env';
import type { Profile, Role } from '@/types/db';

export interface Session {
  userId: string;
  email: string;
  profile: Profile;
}

/**
 * Resolves the signed-in user's profile, promoting the bootstrap email to
 * admin the first time it signs in (so a brand-new deployment has a way in
 * without touching SQL).
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const admin = createAdminClient();
  let { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle<Profile>();

  // The auth trigger normally creates this; make it self-healing anyway.
  if (!profile) {
    const { data: created } = await admin
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: (user.user_metadata?.full_name as string) ?? user.email.split('@')[0],
      })
      .select('*')
      .maybeSingle<Profile>();
    profile = created ?? null;
  }

  if (!profile) return null;

  const bootstrap = serverEnv.adminBootstrapEmail;
  if (bootstrap && user.email.toLowerCase() === bootstrap && profile.role !== 'admin') {
    const { data: promoted } = await admin
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.id)
      .select('*')
      .maybeSingle<Profile>();
    if (promoted) profile = promoted;
  }

  return { userId: user.id, email: user.email, profile };
});

const RANK: Record<Role, number> = { viewer: 0, editor: 1, admin: 2 };

export function hasRole(profile: Profile | null | undefined, minimum: Role): boolean {
  if (!profile) return false;
  return RANK[profile.role] >= RANK[minimum];
}

/**
 * Guard for admin pages and server actions. Redirects to the login page when
 * nobody is signed in, and to /admin/no-access when the account is not staff.
 */
export async function requireStaff(minimum: Role = 'editor'): Promise<Session> {
  const session = await getSession();

  if (!session) redirect('/admin/login');
  if (!hasRole(session.profile, minimum)) redirect('/admin/no-access');

  return session;
}

/** Same check for route handlers, where throwing beats redirecting. */
export async function assertStaff(minimum: Role = 'editor'): Promise<Session> {
  const session = await getSession();

  if (!session || !hasRole(session.profile, minimum)) {
    throw new AuthError(session ? 'Not allowed for this account.' : 'Please sign in.');
  }

  return session;
}

export class AuthError extends Error {
  status = 403;
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}
