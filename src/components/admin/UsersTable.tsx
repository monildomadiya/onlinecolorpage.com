'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setRoleAction } from '@/app/admin/actions/settings';
import type { ActionResult } from '@/app/admin/actions/pages';
import { Alert, Badge, EmptyRow, Select } from './ui';
import { formatDate } from '@/lib/utils';
import type { Profile, Role } from '@/types/db';

const ROLE_TONE: Record<Role, 'violet' | 'sky' | 'slate'> = {
  admin: 'violet',
  editor: 'sky',
  viewer: 'slate',
};

export function UsersTable({
  profiles,
  currentUserId,
}: {
  profiles: Profile[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [notice, setNotice] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  function change(userId: string, role: Role) {
    startTransition(async () => {
      setNotice(await setRoleAction(userId, role));
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {notice && <Alert tone={notice.ok ? 'success' : 'error'}>{notice.message}</Alert>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-extrabold tracking-wide text-slate-500 uppercase">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Account
                </th>
                <th scope="col" className="px-4 py-3">
                  Current role
                </th>
                <th scope="col" className="px-4 py-3">
                  Joined
                </th>
                <th scope="col" className="px-4 py-3">
                  Change role
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {profiles.length === 0 ? (
                <EmptyRow
                  colSpan={4}
                  message="No accounts yet. Create one in Supabase → Authentication → Users."
                />
              ) : (
                profiles.map((profile) => {
                  const isSelf = profile.id === currentUserId;

                  return (
                    <tr key={profile.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800">
                          {profile.full_name ?? profile.email?.split('@')[0] ?? 'Unknown'}
                          {isSelf && <span className="ml-2 text-xs text-slate-400">(you)</span>}
                        </p>
                        <p className="text-xs text-slate-400">{profile.email}</p>
                      </td>

                      <td className="px-4 py-3">
                        <Badge tone={ROLE_TONE[profile.role]}>{profile.role}</Badge>
                      </td>

                      <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-500">
                        {formatDate(profile.created_at)}
                      </td>

                      <td className="px-4 py-3">
                        <Select
                          value={profile.role}
                          disabled={pending || (isSelf && profile.role === 'admin')}
                          aria-label={`Role for ${profile.email ?? profile.id}`}
                          onChange={(e) => change(profile.id, e.target.value as Role)}
                          className="max-w-40"
                        >
                          <option value="viewer">Viewer - no access</option>
                          <option value="editor">Editor - pages & uploads</option>
                          <option value="admin">Admin - everything</option>
                        </Select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <dl className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm sm:grid-cols-3">
        <div>
          <dt className="font-extrabold text-slate-800">Viewer</dt>
          <dd className="mt-0.5 text-slate-500">
            Signed in but locked out of the admin panel. New accounts start here.
          </dd>
        </div>
        <div>
          <dt className="font-extrabold text-slate-800">Editor</dt>
          <dd className="mt-0.5 text-slate-500">
            Upload, edit and publish pages and categories. Cannot delete or change settings.
          </dd>
        </div>
        <div>
          <dt className="font-extrabold text-slate-800">Admin</dt>
          <dd className="mt-0.5 text-slate-500">
            Everything, including deletions, ads, settings and roles.
          </dd>
        </div>
      </dl>
    </div>
  );
}
