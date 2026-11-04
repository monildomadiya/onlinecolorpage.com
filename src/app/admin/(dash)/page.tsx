import Link from 'next/link';
import {
  Database,
  Download,
  Eye,
  FileText,
  FolderTree,
  HardDrive,
  Palette,
  Plus,
  Upload,
} from 'lucide-react';
import { getAdminStats, getEventsDaily, getTopPages, listPages } from '@/lib/admin/queries';
import { getSession } from '@/lib/auth';
import { PageHeader } from '@/components/admin/AdminShell';
import { StatCard } from '@/components/admin/StatCard';
import { TrafficChart } from '@/components/admin/Charts';
import { AdminButton, Badge, Card, Alert } from '@/components/admin/ui';
import { publicUrl } from '@/lib/r2/public';
import { formatBytes, formatDate, formatNumber } from '@/lib/utils';
import { isR2Configured } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [stats, daily, top, recent, session] = await Promise.all([
    getAdminStats(),
    getEventsDaily(30),
    getTopPages(6),
    listPages({ perPage: 6, sort: 'newest' }),
    getSession(),
  ]);

  const firstName = (session?.profile.full_name ?? session?.email ?? 'there').split(/[\s@]/)[0];

  return (
    <>
      <PageHeader
        title={`Hi ${firstName} 👋`}
        description="Everything on onlinecolorpage.com at a glance."
        action={
          <div className="flex gap-2">
            <Link href="/admin/upload">
              <AdminButton variant="secondary">
                <Upload className="size-4" aria-hidden />
                Bulk upload
              </AdminButton>
            </Link>
            <Link href="/admin/pages/new">
              <AdminButton>
                <Plus className="size-4" aria-hidden />
                New page
              </AdminButton>
            </Link>
          </div>
        }
      />

      {!isR2Configured && (
        <Alert tone="warning">
          Cloudflare R2 is not configured, so uploads and PDF generation will fail. Add{' '}
          <code>R2_ACCOUNT_ID</code>, <code>R2_ACCESS_KEY_ID</code>,{' '}
          <code>R2_SECRET_ACCESS_KEY</code> and <code>R2_BUCKET</code>.
        </Alert>
      )}

      {/* ------------------------- stat cards ------------------------- */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Coloring pages"
          value={formatNumber(stats.pages_total)}
          sub={`${stats.pages_published} live · ${stats.pages_draft} draft`}
          icon={<Palette className="size-5" aria-hidden />}
          tone="violet"
        />
        <StatCard
          label="Views"
          value={formatNumber(stats.views_total)}
          sub={`${formatNumber(stats.views_7d)} in the last 7 days`}
          icon={<Eye className="size-5" aria-hidden />}
          tone="sky"
        />
        <StatCard
          label="Colourings"
          value={formatNumber(stats.colorings_total)}
          sub={`${formatNumber(stats.colorings_7d)} in the last 7 days`}
          icon={<FileText className="size-5" aria-hidden />}
          tone="amber"
        />
        <StatCard
          label="Downloads"
          value={formatNumber(stats.downloads_total)}
          sub={`${formatNumber(stats.downloads_7d)} in the last 7 days`}
          icon={<Download className="size-5" aria-hidden />}
          tone="emerald"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Categories"
          value={formatNumber(stats.categories_total)}
          icon={<FolderTree className="size-5" aria-hidden />}
          tone="slate"
        />
        <StatCard
          label="Files in R2"
          value={formatNumber(stats.media_total)}
          icon={<Database className="size-5" aria-hidden />}
          tone="slate"
        />
        <StatCard
          label="Storage used"
          value={formatBytes(stats.storage_bytes)}
          icon={<HardDrive className="size-5" aria-hidden />}
          tone="slate"
        />
      </div>

      {/* ------------------------- chart ------------------------- */}
      <Card
        className="mt-6"
        title="Last 30 days"
        description="Views, colourings and downloads per day."
      >
        <TrafficChart data={daily} />
      </Card>

      {/* ------------------------- tables ------------------------- */}
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Card
          title="Most viewed pages"
          action={
            <Link href="/admin/analytics" className="text-sm font-bold text-violet-600 hover:underline">
              Full analytics →
            </Link>
          }
        >
          {top.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No published pages yet. Upload a few and this fills in.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {top.map((page, index) => (
                <li key={page.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="w-5 shrink-0 text-center text-sm font-extrabold text-slate-300">
                    {index + 1}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={publicUrl(page.thumb_key ?? page.image_key)}
                    alt=""
                    className="size-11 shrink-0 rounded-lg border border-slate-200 bg-white object-contain p-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/color/${page.slug}`}
                      target="_blank"
                      className="block truncate text-sm font-bold text-slate-800 hover:text-violet-600"
                    >
                      {page.title}
                    </Link>
                    <p className="text-xs text-slate-400">
                      {formatNumber(page.view_count)} views · {formatNumber(page.color_count)}{' '}
                      coloured · {formatNumber(page.download_count)} downloads
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Recently added"
          action={
            <Link href="/admin/pages" className="text-sm font-bold text-violet-600 hover:underline">
              Manage all →
            </Link>
          }
        >
          {recent.items.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-500">Nothing uploaded yet.</p>
              <Link href="/admin/upload" className="mt-3 inline-block">
                <AdminButton>
                  <Upload className="size-4" aria-hidden />
                  Upload your first pages
                </AdminButton>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.items.map((page) => (
                <li key={page.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={publicUrl(page.thumb_key ?? page.image_key)}
                    alt=""
                    className="size-11 shrink-0 rounded-lg border border-slate-200 bg-white object-contain p-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/pages/${page.id}`}
                      className="block truncate text-sm font-bold text-slate-800 hover:text-violet-600"
                    >
                      {page.title}
                    </Link>
                    <p className="text-xs text-slate-400">
                      {page.category?.name ?? 'Uncategorised'} · {formatDate(page.created_at)}
                    </p>
                  </div>
                  <Badge tone={page.is_published ? 'green' : 'amber'}>
                    {page.is_published ? 'Live' : 'Draft'}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
