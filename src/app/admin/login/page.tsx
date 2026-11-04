import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/components/admin/LoginForm';
import { isSupabaseConfigured } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Admin sign in',
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-violet-600 text-2xl shadow-[0_6px_0_#5b21b6]">
            🖍️
          </span>
          <h1 className="mt-4 text-xl font-extrabold text-slate-900">Online Color Page</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to the admin panel</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {isSupabaseConfigured ? (
            <Suspense fallback={<div className="h-56 animate-pulse rounded-xl bg-slate-100" />}>
              <LoginForm />
            </Suspense>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
              <p className="font-extrabold">Supabase is not configured.</p>
              <p className="mt-1.5">
                Add <code>NEXT_PUBLIC_SUPABASE_URL</code>,{' '}
                <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and{' '}
                <code>SUPABASE_SERVICE_ROLE_KEY</code> to your environment, then restart.
              </p>
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          Accounts are created in Supabase → Authentication → Users.
        </p>
      </div>
    </main>
  );
}
