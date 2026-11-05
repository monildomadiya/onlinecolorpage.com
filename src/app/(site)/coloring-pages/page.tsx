import { SearchX } from 'lucide-react';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getPages, getPopularTags, type SortOption } from '@/lib/queries';
import { PageGrid, PageGridSkeleton } from '@/components/site/PageGrid';
import { FilterBar } from '@/components/site/FilterBar';
import { AdSlot } from '@/components/site/AdSlot';
import { Pagination } from '@/components/ui/Pagination';
import { Breadcrumbs, EmptyState } from '@/components/ui/Section';
import { ButtonLink } from '@/components/ui/Button';
import { siteUrl } from '@/lib/seo/metadata';
import type { Difficulty } from '@/types/db';

export const revalidate = 300;

const PER_PAGE = 30;

export const metadata: Metadata = {
  title: 'All Free Coloring Pages - Colour Online or Print',
  description:
    'Browse every free coloring page on the site. Filter by theme, difficulty or tag, colour it online in your browser, then download the PNG or print the PDF.',
  alternates: { canonical: siteUrl('/coloring-pages') },
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AllPagesRoute({ searchParams }: Props) {
  const sp = await searchParams;

  const page = Math.max(1, Number.parseInt(one(sp.page) ?? '1', 10) || 1);
  const sort = (one(sp.sort) ?? 'newest') as SortOption;
  const difficulty = one(sp.difficulty) as Difficulty | undefined;
  const tag = one(sp.tag);

  const [result, tags] = await Promise.all([
    getPages({ page, perPage: PER_PAGE, sort, difficulty, tag }),
    getPopularTags(24),
  ]);

  const hrefFor = (target: number) => {
    const params = new URLSearchParams();
    if (sort !== 'newest') params.set('sort', sort);
    if (difficulty) params.set('difficulty', difficulty);
    if (tag) params.set('tag', tag);
    if (target > 1) params.set('page', String(target));
    const query = params.toString();
    return query ? `/coloring-pages?${query}` : '/coloring-pages';
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-6">
      <Breadcrumbs
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Coloring pages', path: '/coloring-pages' },
        ]}
      />

      <header className="mb-6">
        <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">
          All coloring pages
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold text-ink-soft sm:text-base">
          {result.total > 0
            ? `${result.total} free pages to colour online or print at home. Pick a theme, choose your colours and go.`
            : 'Free pages to colour online or print at home.'}
        </p>
      </header>

      <Suspense fallback={<div className="card-kid h-24 animate-pulse" />}>
        <FilterBar basePath="/coloring-pages" tags={tags} className="mb-6" />
      </Suspense>

      <AdSlot slot="header" className="mb-6" />

      {result.items.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Nothing matches that yet"
          message="Try clearing the filters, or have a look at the categories instead."
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

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        hrefFor={hrefFor}
        className="mt-10"
      />

      <AdSlot slot="page_bottom" />
    </div>
  );
}
