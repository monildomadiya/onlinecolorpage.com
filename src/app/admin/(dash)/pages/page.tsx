import Link from 'next/link';
import { Plus, Search, Upload } from 'lucide-react';
import { listCategories, listPages, type AdminSort, type PageStatus } from '@/lib/admin/queries';
import { getSession, hasRole } from '@/lib/auth';
import { publicUrl } from '@/lib/r2/public';
import { PageHeader } from '@/components/admin/AdminShell';
import { PagesTable } from '@/components/admin/PagesTable';
import { AdminButton, Alert } from '@/components/admin/ui';
import { Pagination } from '@/components/ui/Pagination';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

export default async function AdminPagesList({ searchParams }: Props) {
  const sp = await searchParams;

  const q = one(sp.q);
  const status = (one(sp.status) || 'all') as PageStatus;
  const sort = (one(sp.sort) || 'newest') as AdminSort;
  const categoryId = one(sp.category);
  const page = Math.max(1, Number.parseInt(one(sp.page) || '1', 10) || 1);

  const [result, categories, session] = await Promise.all([
    listPages({ q, status, sort, categoryId: categoryId || undefined, page, perPage: 25 }),
    listCategories(),
    getSession(),
  ]);

  // Resolve thumbnails server-side so the table stays R2-agnostic.
  const thumbFor = Object.fromEntries(
    result.items.map((item) => [item.id, publicUrl(item.thumb_key ?? item.image_key)]),
  );

  const hrefFor = (target: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status !== 'all') params.set('status', status);
    if (sort !== 'newest') params.set('sort', sort);
    if (categoryId) params.set('category', categoryId);
    if (target > 1) params.set('page', String(target));
    const query = params.toString();
    return query ? `/admin/pages?${query}` : '/admin/pages';
  };

  return (
    <>
      <PageHeader
        title="Coloring pages"
        description={`${result.total} page${result.total === 1 ? '' : 's'} in the library.`}
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

      {one(sp.deleted) === '1' && <Alert tone="success">Page deleted.</Alert>}

      {/* Plain GET form: filters stay shareable and bookmarkable. */}
      <form className="mt-4 mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <label htmlFor="q" className="sr-only">
            Search pages
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search title or slug…"
            className="w-full rounded-xl border border-slate-300 py-2.5 pr-3 pl-9 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="status" className="sr-only">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
            <option value="featured">Featured</option>
          </select>
        </div>

        <div>
          <label htmlFor="category" className="sr-only">
            Category
          </label>
          <select
            id="category"
            name="category"
            defaultValue={categoryId}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.emoji} {category.name} ({category.page_count})
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <label htmlFor="sort" className="sr-only">
            Sort
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={sort}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title">Title A-Z</option>
            <option value="views">Most viewed</option>
            <option value="downloads">Most downloaded</option>
          </select>
          <AdminButton type="submit">Apply</AdminButton>
        </div>
      </form>

      <PagesTable
        pages={result.items}
        thumbFor={thumbFor}
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
