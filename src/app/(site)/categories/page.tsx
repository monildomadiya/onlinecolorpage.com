import { Grid3x3 } from 'lucide-react';
import type { Metadata } from 'next';
import { getCategoriesWithCounts } from '@/lib/queries';
import { CategoryCard } from '@/components/site/CategoryCard';
import { AdSlot } from '@/components/site/AdSlot';
import { Breadcrumbs, EmptyState } from '@/components/ui/Section';
import { ButtonLink } from '@/components/ui/Button';
import { siteUrl } from '@/lib/seo/metadata';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Coloring Page Categories - Animals, Cartoons, Vehicles & More',
  description:
    'Every coloring page category in one place: animals, cartoons, vehicles, princesses, dinosaurs, flowers, space, food and more. All free to colour online or print.',
  alternates: { canonical: siteUrl('/categories') },
};

export default async function CategoriesRoute() {
  const categories = await getCategoriesWithCounts();
  const total = categories.reduce((sum, c) => sum + c.page_count, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-6">
      <Breadcrumbs
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Categories', path: '/categories' },
        ]}
      />

      <header className="mb-8">
        <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">
          Pick a theme
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold text-ink-soft sm:text-base">
          {categories.length} collections and {total} free coloring pages. Tap a theme to see
          everything inside it.
        </p>
      </header>

      <AdSlot slot="header" className="mb-6" />

      {categories.length === 0 ? (
        <EmptyState
          icon={Grid3x3}
          title="No categories yet"
          message="Add a few categories from the admin panel and they will appear here."
          action={
            <ButtonLink href="/admin/categories" tone="grape">
              Open admin panel
            </ButtonLink>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} count={category.page_count} />
          ))}
        </div>
      )}

      <AdSlot slot="page_bottom" />
    </div>
  );
}
