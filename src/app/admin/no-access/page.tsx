import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { signOutAction } from '@/app/admin/actions/auth';

export const metadata: Metadata = {
  title: 'No access',
  robots: { index: false, follow: false },
};

export default async function NoAccessPage() {
  const session = await getSession();

  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
        <ShieldAlert className="mx-auto size-11 text-amber-500" aria-hidden />

        <h1 className="mt-4 text-xl font-extrabold text-slate-900">You are signed in, but…</h1>
        <p className="mt-2 text-sm text-slate-600">
          {session?.email ? (
            <>
              <strong className="font-extrabold">{session.email}</strong> does not have editor
              access to the admin panel yet.
            </>
          ) : (
            'This account does not have editor access to the admin panel.'
          )}
        </p>

        <div className="mt-5 rounded-xl bg-slate-50 p-4 text-left text-xs text-slate-600">
          <p className="font-extrabold text-slate-800">To grant access</p>
          <p className="mt-1.5">Run this in the Supabase SQL editor:</p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">
            {`update public.profiles
   set role = 'admin'
 where email = '${session?.email ?? 'you@example.com'}';`}
          </pre>
          <p className="mt-2">
            Or set <code>ADMIN_BOOTSTRAP_EMAIL</code> to this address and sign in again.
          </p>
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Back to site
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
