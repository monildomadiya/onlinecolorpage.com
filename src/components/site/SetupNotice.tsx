import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { isR2Configured, isSupabaseConfigured } from '@/lib/env';

/**
 * Shown on a fresh deployment while the env vars are still blank, so the first
 * page load explains itself instead of looking broken.
 */
export function SetupNotice() {
  const missing: string[] = [];
  if (!isSupabaseConfigured) missing.push('Supabase (database)');
  if (!isR2Configured) missing.push('Cloudflare R2 (file storage)');

  if (missing.length === 0) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="card-kid border-4 border-sunny p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-6 shrink-0 text-sunny-dark" aria-hidden />
          <div>
            <h2 className="font-display text-xl font-extrabold text-ink">Almost ready!</h2>
            <p className="mt-1 text-sm font-semibold text-ink-soft">
              Still waiting on: <strong>{missing.join(' and ')}</strong>.
            </p>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm font-semibold text-ink-soft">
              <li>
                Copy <code className="rounded bg-cream-deep px-1.5 py-0.5">.env.example</code> to{' '}
                <code className="rounded bg-cream-deep px-1.5 py-0.5">.env.local</code> and fill it in.
              </li>
              <li>
                Run <code className="rounded bg-cream-deep px-1.5 py-0.5">supabase/migrations/0001_init.sql</code>{' '}
                then <code className="rounded bg-cream-deep px-1.5 py-0.5">0002_seed.sql</code> in the
                Supabase SQL editor.
              </li>
              <li>
                Create an Auth user, then sign in at{' '}
                <Link href="/admin/login" className="font-extrabold text-grape-600 underline">
                  /admin/login
                </Link>{' '}
                and upload your first coloring pages.
              </li>
            </ol>
            <p className="mt-3 text-xs font-bold text-ink-soft/70">
              Full walkthrough: <code>docs/SETUP.md</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
