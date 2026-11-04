import type { Metadata } from 'next';
import { getPages } from '@/lib/queries';
import { PageGrid } from '@/components/site/PageGrid';
import { AdSlot } from '@/components/site/AdSlot';
import { Pagination } from '@/components/ui/Pagination';
import { Breadcrumbs, EmptyState } from '@/components/ui/Section';
import { ButtonLink } from '@/components/ui/Button';
import { siteUrl } from '@/lib/seo/metadata';

export const revalidate = 1800;

export const metadata: Metadata = {
  title: 'Most Popular Coloring Pages - Kids&apos; Favourites',
  description:
    'The most loved free coloring pages on the site, ranked by how many kids have coloured them. Colour online or print the PDF.',
  alternates: { canonical: siteUrl('/popular') },
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PopularRoute({ searchParams }: Props) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const page = Math.max(1, Number.parseInt(raw ?? '1', 10) || 1);

  const result = await getPages({ sort: 'popular', page, perPage: 30 });

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-6">
      <Breadcrumbs
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Most loved', path: '/popular' },
        ]}
      />

      <header className="mb-6">
        <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">
          🔥 Most loved coloring pages
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold text-ink-soft sm:text-base">
          The pages kids come back to again and again. Ranked by how many times they have been
          viewed and coloured.
        </p>
      </header>

      <AdSlot slot="header" className="mb-6" />

      {result.items.length === 0 ? (
        <EmptyState
          emoji="🔥"
          title="No favourites yet"
          message="Once pages start getting coloured, the most popular ones will show up here."
          action={
            <ButtonLink href="/coloring-pages" tone="grape">
              See all pages
            </ButtonLink>
          }
        />
      ) : (
        <PageGrid pages={result.items} adAfter={15} priorityCount={5} />
      )}

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        hrefFor={(target) => (target > 1 ? `/popular?page=${target}` : '/popular')}
        className="mt-10"
      />

      <AdSlot slot="page_bottom" />
    </div>
  );
}
