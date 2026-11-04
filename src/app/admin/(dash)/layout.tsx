import type { Metadata } from 'next';
import { requireStaff } from '@/lib/auth';
import { AdminShell } from '@/components/admin/AdminShell';
import { signOutAction } from '@/app/admin/actions/auth';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

/** Every page inside this group is gated on an editor-or-above profile. */
export default async function AdminDashLayout({ children }: { children: React.ReactNode }) {
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
