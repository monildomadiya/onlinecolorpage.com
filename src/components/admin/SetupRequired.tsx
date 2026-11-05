import { CrayonMark } from '@/components/ui/Decor';

/**
 * Stands in for the whole admin area while SUPABASE_SERVICE_ROLE_KEY is
 * missing or still the .env.example placeholder.
 *
 * Every admin query runs through the service-role client, so without that key
 * each page throws on its first call and the browser shows "Application
 * error: a server-side exception has occurred" - which names nothing and
 * sends the owner to the server logs. SetupNotice already does this job for
 * the public site; this is the same courtesy for the panel.
 */
export function SetupRequired() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-ink/10 bg-grape-600 text-white">
            <CrayonMark className="size-8" />
          </span>
          <h1 className="mt-4 text-xl font-extrabold text-slate-900">One key still missing</h1>
          <p className="mt-1 text-sm text-slate-500">
            You are signed in. The panel just cannot read the database yet.
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-ink/10 bg-white p-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            <p className="font-extrabold">SUPABASE_SERVICE_ROLE_KEY is not set.</p>
            <p className="mt-1.5">
              It is still empty or left at the <code>sb_secret_...</code> placeholder, so every
              admin query comes back <em>Invalid API key</em>.
            </p>
          </div>

          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm font-semibold text-slate-600">
            <li>
              Copy it from Supabase → Project Settings → API Keys → <strong>Secret keys</strong>.
            </li>
            <li>
              Put it in <code>.env.local</code> on the <code>SUPABASE_SERVICE_ROLE_KEY=</code> line,
              or run <code>npm run secret SUPABASE_SERVICE_ROLE_KEY</code> to be prompted for it.
            </li>
            <li>
              The dev server restarts itself on that change. On Azure, add it to the app settings
              with <code>npm run azure:settings</code>.
            </li>
          </ol>

          <p className="mt-4 text-xs font-bold text-slate-400">
            <code>npm run check</code> verifies the whole setup · full walkthrough in{' '}
            <code>docs/SETUP.md</code>
          </p>
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          This key is server-only. It bypasses RLS, so it must never reach the browser.
        </p>
      </div>
    </main>
  );
}
