import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getCategories, getCategoryBySlug, getPages, type SortOption } from '@/lib/queries';
import { publicUrl } from '@/lib/r2/public';
import { buildCategoryMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema, categorySchema } from '@/lib/seo/jsonld';
import { PageGrid, PageGridSkeleton } from '@/components/site/PageGrid';
import { CategoryRail } from '@/components/site/CategoryCard';
import { FilterBar } from '@/components/site/FilterBar';
import { AdSlot } from '@/components/site/AdSlot';
import { JsonLd } from '@/components/site/JsonLd';
import { Pagination } from '@/components/ui/Pagination';
import { Breadcrumbs, EmptyState } from '@/components/ui/Section';
import { ButtonLink } from '@/components/ui/Button';
import type { Difficulty } from '@/types/db';

export const revalidate = 300;
export const dynamicParams = true;

const PER_PAGE = 30;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Pre-render the category shells; individual pages stay on ISR. */
export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return { title: 'Category not found', robots: { index: false, follow: true } };
  }

  const { total } = await getPages({ categoryId: category.id, perPage: 1 });
  return buildCategoryMetadata(category, total);
}

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CategoryRoute({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const page = Math.max(1, Number.parseInt(one(sp.page) ?? '1', 10) || 1);
  const sort = (one(sp.sort) ?? 'newest') as SortOption;
  const difficulty = one(sp.difficulty) as Difficulty | undefined;

  const [result, siblings] = await Promise.all([
    getPages({ categoryId: category.id, page, perPage: PER_PAGE, sort, difficulty }),
    getCategories(),
  ]);

  const accent = category.color ?? '#8b4ff5';
  const basePath = `/category/${category.slug}`;

  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Categories', path: '/categories' },
    { name: category.name, path: basePath },
  ];

  const hrefFor = (target: number) => {
    const next = new URLSearchParams();
    if (sort !== 'newest') next.set('sort', sort);
    if (difficulty) next.set('difficulty', difficulty);
    if (target > 1) next.set('page', String(target));
    const query = next.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  return (
    <>
      <JsonLd
        data={[
          categorySchema(category, result.items, (p) => publicUrl(p.thumb_key ?? p.image_key)),
          breadcrumbSchema(trail),
        ]}
      />

      <section
        className="dotted relative overflow-hidden"
        style={{ background: `linear-gradient(160deg, ${accent}24, var(--color-cream))` }}
      >
        <div className="mx-auto max-w-7xl px-4 pt-6 pb-10 sm:px-6">
          <Breadcrumbs trail={trail} />

          <div className="flex flex-wrap items-center gap-4">
            <span
              aria-hidden
              className="grid size-20 shrink-0 place-items-center rounded-[1.75rem] bg-white text-4xl shadow-[0_6px_0_rgba(43,33,64,0.08)]"
            >
              {category.emoji ?? '🎨'}
            </span>

            <div className="min-w-0">
              <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">
                {category.name} coloring pages
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm font-semibold text-ink-soft sm:text-base">
                {category.description ??
                  `Free ${category.name.toLowerCase()} coloring pages to colour online or print at home.`}
              </p>
              <p className="mt-2 font-display text-sm font-extrabold" style={{ color: accent }}>
                {result.total} page{result.total === 1 ? '' : 's'} in this collection
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6">
        <div className="mb-6">
          <CategoryRail categories={siblings.filter((c) => c.slug !== category.slug)} />
        </div>

        <Suspense fallback={<div className="card-kid h-20 animate-pulse" />}>
          <FilterBar basePath={basePath} className="mb-6" />
        </Suspense>

        <AdSlot slot="header" className="mb-6" />

        {result.items.length === 0 ? (
          <EmptyState
            emoji="🪣"
            title="This collection is still filling up"
            message="No pages here yet. Try another category - there is plenty to colour."
            action={
              <ButtonLink href="/coloring-pages" tone="grape">
                See all pages
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
    </>
  );
}
