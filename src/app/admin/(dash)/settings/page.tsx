import { requireStaff } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { PageHeader } from '@/components/admin/AdminShell';
import {
  FeatureSettingsForm,
  HomeSettingsForm,
  SeoSettingsForm,
  SiteSettingsForm,
} from '@/components/admin/SettingsForm';
import { Alert, Card } from '@/components/admin/ui';
import { isR2Configured, isSupabaseConfigured, publicEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  await requireStaff('admin');
  const settings = await getSettings();

  const env = [
    ['Site URL', publicEnv.siteUrl],
    ['Supabase', isSupabaseConfigured ? 'Connected' : 'Not configured'],
    ['Cloudflare R2', isR2Configured ? 'Connected' : 'Not configured'],
    ['R2 public base', process.env.R2_PUBLIC_BASE_URL || 'none - files stream via /api/file'],
    ['AdSense client', publicEnv.adsenseClient || 'not set'],
    ['Google Analytics', publicEnv.gaId || 'not set'],
  ] as const;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Everything here is stored in Supabase and applies immediately."
      />

      {settings.features.maintenance && (
        <Alert tone="warning">
          <strong>Maintenance mode is on.</strong> Visitors see a holding page instead of the site.
          Turn it off in Features below.
        </Alert>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <SiteSettingsForm settings={settings} />
        <HomeSettingsForm settings={settings} />
        <SeoSettingsForm settings={settings} />
        <FeatureSettingsForm settings={settings} />
      </div>

      <Card
        className="mt-5"
        title="Environment"
        description="Read-only. These come from the deployment, not the database."
      >
        <dl className="divide-y divide-slate-100">
          {env.map(([label, value]) => (
            <div key={label} className="flex flex-wrap justify-between gap-2 py-2.5 text-sm">
              <dt className="font-bold text-slate-600">{label}</dt>
              <dd className="font-mono text-xs break-all text-slate-500">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-slate-400">
          On Azure these live in Configuration → Application settings. Changing one restarts the
          app.
        </p>
      </Card>
    </>
  );
}
