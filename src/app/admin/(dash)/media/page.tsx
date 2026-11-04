import Link from 'next/link';
import { getAdminStats, listMedia } from '@/lib/admin/queries';
import { getSession, hasRole } from '@/lib/auth';
import { publicUrl } from '@/lib/r2/public';
import { PageHeader } from '@/components/admin/AdminShell';
import { MediaGrid } from '@/components/admin/MediaGrid';
import { Pagination } from '@/components/ui/Pagination';
import { formatBytes, formatNumber, cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const KINDS = [
  { value: 'all', label: 'Everything' },
  { value: 'image', label: 'Line art & covers' },
  { value: 'thumb', label: 'Thumbnails' },
  { value: 'pdf', label: 'PDFs' },
] as const;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

export default async function AdminMediaPage({ searchParams }: Props) {
  const sp = await searchParams;
  const kind = one(sp.kind) || 'all';
  const page = Math.max(1, Number.parseInt(one(sp.page) || '1', 10) || 1);

  const [result, stats, session] = await Promise.all([
    listMedia({ kind, page, perPage: 40 }),
    getAdminStats(),
    getSession(),
  ]);

  const urlFor = Object.fromEntries(result.items.map((item) => [item.id, publicUrl(item.key)]));

  const hrefFor = (target: number) => {
    const params = new URLSearchParams();
    if (kind !== 'all') params.set('kind', kind);
    if (target > 1) params.set('page', String(target));
    const query = params.toString();
    return query ? `/admin/media?${query}` : '/admin/media';
  };

  return (
    <>
      <PageHeader
        title="Media library"
        description={`${formatNumber(stats.media_total)} files in Cloudflare R2 · ${formatBytes(stats.storage_bytes)} stored`}
      />

      <nav aria-label="Filter by type" className="mb-5 flex flex-wrap gap-2">
        {KINDS.map((option) => (
          <Link
            key={option.value}
            href={option.value === 'all' ? '/admin/media' : `/admin/media?kind=${option.value}`}
            className={cn(
              'rounded-xl px-3.5 py-2 text-sm font-bold transition',
              kind === option.value
                ? 'bg-violet-600 text-white'
                : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50',
            )}
          >
            {option.label}
          </Link>
        ))}
      </nav>

      <MediaGrid
        items={result.items}
        urlFor={urlFor}
        canDelete={hasRole(session?.profile, 'admin')}
      />

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        hrefFor={hrefFor}
        className="mt-8"
      />
    </>
  );
}
