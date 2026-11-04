import { listAdSlots } from '@/lib/admin/queries';
import { getSettings } from '@/lib/settings';
import { requireStaff } from '@/lib/auth';
import { PageHeader } from '@/components/admin/AdminShell';
import { AdSlotForm, AdsSettingsForm } from '@/components/admin/AdsForm';
import { Alert } from '@/components/admin/ui';
import { publicEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default async function AdminAdsPage() {
  await requireStaff('admin');

  const [slots, settings] = await Promise.all([listAdSlots(), getSettings()]);

  return (
    <>
      <PageHeader
        title="Ads"
        description="Google AdSense placements. Each slot renders nothing until you paste its code and switch it on."
      />

      <div className="space-y-5">
        <AdsSettingsForm ads={settings.ads} envClient={publicEnv.adsenseClient} />

        <Alert tone="info">
          <strong>Before switching anything on:</strong> AdSense has extra rules for sites aimed at
          children. In AdSense, tag this site as child-directed so only non-personalised,
          family-safe ads are served. Keep ads away from the coloring canvas itself - accidental
          clicks from children are a policy risk.
        </Alert>

        <div className="grid gap-5 xl:grid-cols-2">
          {slots.map((slot) => (
            <AdSlotForm key={slot.id} slot={slot} />
          ))}
        </div>

        {slots.length === 0 && (
          <Alert tone="warning">
            No ad slots found. Run <code>supabase/migrations/0002_seed.sql</code> to create them.
          </Alert>
        )}
      </div>
    </>
  );
}
