import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getPages, getPopularTags } from '@/lib/queries';
import { PageGrid, PageGridSkeleton } from '@/components/site/PageGrid';
import { SearchBox } from '@/components/site/SearchBox';
import { AdSlot } from '@/components/site/AdSlot';
import { Pagination } from '@/components/ui/Pagination';
import { Breadcrumbs, EmptyState } from '@/components/ui/Section';
import { ButtonLink } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Search coloring pages',
  description: 'Search thousands of free coloring pages by name, theme or keyword.',
  // Search result pages should never compete with the real listings.
  robots: { index: false, follow: true },
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SearchRoute({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (one(sp.q) ?? '').trim();
  const page = Math.max(1, Number.parseInt(one(sp.page) ?? '1', 10) || 1);

  const [result, tags] = await Promise.all([
    q ? getPages({ q, page, perPage: 30 }) : Promise.resolve(null),
    getPopularTags(18),
  ]);

  const hrefFor = (target: number) =>
    `/search?q=${encodeURIComponent(q)}${target > 1 ? `&page=${target}` : ''}`;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-6">
      <Breadcrumbs
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Search', path: '/search' },
        ]}
      />

      <header className="mb-6">
        <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">
          🔍 {q ? `Results for “${q}”` : 'Search coloring pages'}
        </h1>
        {result && (
          <p className="mt-2 text-sm font-semibold text-ink-soft">
            {result.total} page{result.total === 1 ? '' : 's'} found
          </p>
        )}
      </header>

      <div className="mb-8 max-w-xl">
        <SearchBox defaultValue={q} autoFocus={!q} />
      </div>

      {tags.length > 0 && (
        <div className="mb-8">
          <p className="mb-2 font-display text-[11px] font-extrabold tracking-wide text-ink-soft uppercase">
            Popular searches
          </p>
          <div className="flex flex-wrap gap-2">
            {tags.map(({ tag }) => (
              <a
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                className="rounded-full bg-white px-3.5 py-2 text-xs font-extrabold text-grape-700 shadow-[0_3px_0_var(--color-cream-deep)] transition hover:bg-grape-100"
              >
                {tag}
              </a>
            ))}
          </div>
        </div>
      )}

      <AdSlot slot="header" className="mb-6" />

      {!result ? null : result.items.length === 0 ? (
        <EmptyState
          emoji="🙈"
          title={`No pages match “${q}”`}
          message="Try a shorter word, or browse by category instead."
          action={
            <ButtonLink href="/categories" tone="grape">
              Browse categories
            </ButtonLink>
          }
        />
      ) : (
        <Suspense fallback={<PageGridSkeleton count={10} />}>
          <PageGrid pages={result.items} adAfter={15} priorityCount={5} />
        </Suspense>
      )}

      {result && (
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          hrefFor={hrefFor}
          className="mt-10"
        />
      )}
    </div>
  );
}
