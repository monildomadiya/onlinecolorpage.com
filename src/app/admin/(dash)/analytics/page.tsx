import Link from 'next/link';
import { getAdminStats, getAudienceSplit, getEventsDaily, getTopPages } from '@/lib/admin/queries';
import { PageHeader } from '@/components/admin/AdminShell';
import { StatCard } from '@/components/admin/StatCard';
import { RankChart, SplitChart, TrafficChart } from '@/components/admin/Charts';
import { Card } from '@/components/admin/ui';
import { formatNumber, cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const RANGES = [7, 30, 90] as const;

const EVENT_LABELS: Record<string, string> = {
  view: 'Page views',
  color_start: 'Started colouring',
  color_finish: 'Finished colouring',
  download_png: 'PNG downloads',
  download_pdf: 'PDF downloads',
  print: 'Prints',
  like: 'Likes',
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminAnalyticsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.days) ? sp.days[0] : sp.days;
  const days = RANGES.includes(Number(raw) as (typeof RANGES)[number]) ? Number(raw) : 30;

  const [stats, daily, top, audience] = await Promise.all([
    getAdminStats(),
    getEventsDaily(days),
    getTopPages(12),
    getAudienceSplit(days),
  ]);

  const finishes = audience.events.find((e) => e.name === 'color_finish')?.value ?? 0;
  const starts = audience.events.find((e) => e.name === 'color_start')?.value ?? 0;
  const completion = starts > 0 ? Math.round((finishes / starts) * 100) : 0;

  return (
    <>
      <PageHeader
        title="Analytics"
        description="First-party, anonymous event data from your own database - no third-party tracker needed."
      />

      <nav aria-label="Date range" className="mb-5 flex gap-2">
        {RANGES.map((range) => (
          <Link
            key={range}
            href={`/admin/analytics?days=${range}`}
            className={cn(
              'rounded-xl px-3.5 py-2 text-sm font-bold transition',
              days === range
                ? 'bg-violet-600 text-white'
                : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50',
            )}
          >
            Last {range} days
          </Link>
        ))}
      </nav>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={`Events (${days}d)`}
          value={formatNumber(audience.total)}
          sub="Every tracked interaction"
          tone="violet"
        />
        <StatCard
          label="Views all time"
          value={formatNumber(stats.views_total)}
          tone="sky"
        />
        <StatCard
          label="Completion rate"
          value={`${completion}%`}
          sub={`${formatNumber(finishes)} of ${formatNumber(starts)} finished`}
          tone="amber"
        />
        <StatCard
          label="Downloads all time"
          value={formatNumber(stats.downloads_total)}
          tone="emerald"
        />
      </div>

      <Card className="mt-6" title={`Activity - last ${days} days`}>
        <TrafficChart data={daily} />
      </Card>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Card title="Most viewed pages" description="All-time view counts.">
          <RankChart
            data={top.map((page) => ({
              name: page.title.length > 26 ? `${page.title.slice(0, 24)}…` : page.title,
              value: page.view_count,
            }))}
            height={360}
          />
        </Card>

        <div className="space-y-4">
          <Card title="Devices" description={`Share of events over ${days} days.`}>
            <SplitChart data={audience.devices} />
          </Card>

          <Card title="What people do">
            {audience.events.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No events in this window.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {audience.events.map((event) => (
                  <li key={event.name} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="font-bold text-slate-700">
                      {EVENT_LABELS[event.name] ?? event.name}
                    </span>
                    <span className="font-extrabold text-slate-900">
                      {formatNumber(event.value)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {audience.countries.length > 0 && (
        <Card className="mt-6" title="Top countries" description="From the host's geo header, where available.">
          <RankChart data={audience.countries} color="#10b981" height={280} />
        </Card>
      )}

      <p className="mt-6 text-xs text-slate-400">
        Events are capped at 50,000 rows per query for speed. Views, downloads and colourings are
        also kept as running counters on each page, which is what the all-time numbers use.
      </p>
    </>
  );
}
