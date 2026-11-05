import type { Metadata } from 'next';
import { requireStaff } from '@/lib/auth';
import { isSupabaseAdminConfigured } from '@/lib/env';
import { AdminShell } from '@/components/admin/AdminShell';
import { SetupRequired } from '@/components/admin/SetupRequired';
import { signOutAction } from '@/app/admin/actions/auth';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

/** Every page inside this group is gated on an editor-or-above profile. */
export default async function AdminDashLayout({ children }: { children: React.ReactNode }) {
  // requireStaff() reads the profile with the service-role client, so without
  // that key it cannot tell "not signed in" from "cannot reach the database".
  // Answering that question first keeps the panel explaining itself.
  if (!isSupabaseAdminConfigured) return <SetupRequired />;

  const { email, profile } = await requireStaff('editor');

  return (
    <AdminShell
      email={email}
      name={profile.full_name ?? email.split('@')[0]}
      role={profile.role}
      onSignOut={signOutAction}
    >
      {children}
    </AdminShell>
  );
}
