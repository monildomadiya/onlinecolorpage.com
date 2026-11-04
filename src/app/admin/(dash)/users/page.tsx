import { listProfiles } from '@/lib/admin/queries';
import { requireStaff } from '@/lib/auth';
import { PageHeader } from '@/components/admin/AdminShell';
import { UsersTable } from '@/components/admin/UsersTable';
import { Alert } from '@/components/admin/ui';
import { serverEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const session = await requireStaff('admin');
  const profiles = await listProfiles();

  return (
    <>
      <PageHeader
        title="Users"
        description="Who can get into the admin panel, and how much they can do."
      />

      <Alert tone="info">
        Accounts are created in <strong>Supabase → Authentication → Users</strong>. Anyone who signs
        in gets a <em>viewer</em> profile automatically; promote them here.
        {serverEnv.adminBootstrapEmail && (
          <>
            {' '}
            <code>{serverEnv.adminBootstrapEmail}</code> is the bootstrap address and is promoted to
            admin on sign-in.
          </>
        )}
      </Alert>

      <div className="mt-5">
        <UsersTable profiles={profiles} currentUserId={session.userId} />
      </div>
    </>
  );
}
