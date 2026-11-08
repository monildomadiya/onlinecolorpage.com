import { isR2Configured, isSupabaseConfigured } from '@/lib/env';

/**
 * Developer aid for a half-configured checkout: the first page load explains
 * itself instead of looking broken.
 *
 * It renders in development only. A visitor to the live site has no use for
 *"copy .env.example", and showing them the repo's internals would be a leak
 * as much as an eyesore - on a deployment the owner hears about missing
 * configuration from `/api/health`, `npm run check` and the admin panel.
 */
export function SetupNotice() {
  if (process.env.NODE_ENV === 'production') return null;

  const steps: string[] = [];
  if (!isSupabaseConfigured) {
    steps.push(
      'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then run supabase/migrations/0001_init.sql and 0002_seed.sql in the SQL editor.',
    );
  }
  if (!isR2Configured) {
    steps.push(
      'Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET in .env.local.',
    );
  }

  if (steps.length === 0) return null;

  const missing = [
    !isSupabaseConfigured && 'Supabase (database)',
    !isR2Configured && 'Cloudflare R2 (file storage)',
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="card-kid border-sunny/60 p-6">
        <h2 className="font-display text-xl font-extrabold text-ink">Not configured yet</h2>
        <p className="mt-1 text-sm font-semibold text-ink-soft">
          Still waiting on: <strong>{missing.join(' and ')}</strong>. This panel only ever shows in
          development.
        </p>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm font-semibold text-ink-soft">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
          <li>
            Run{' '}
            <code className="rounded-md border border-edge bg-white px-1.5 py-0.5">
              npm run check
            </code>{' '}
            to verify the lot.
          </li>
        </ol>
        <p className="mt-3 text-xs font-bold text-ink-soft/70">
          Full walkthrough: <code>docs/SETUP.md</code>
        </p>
      </div>
    </div>
  );
}
