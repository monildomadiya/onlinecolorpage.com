import { getCategoriesWithCounts } from '@/lib/queries';
import { getSettings } from '@/lib/settings';
import { formatNumber } from '@/lib/utils';
import { HeaderNav } from './HeaderNav';

/** Server wrapper: fetches the nav data, hands it to the interactive shell. */
export async function Header() {
  const [settings, categories] = await Promise.all([getSettings(), getCategoriesWithCounts()]);

  // The strip above the header sells the library by its size. On a fresh
  // install there is nothing to count yet, so it falls back to the tagline
  // rather than announcing zero.
  const total = categories.reduce((sum, category) => sum + category.page_count, 0);
  const tagline =
    total > 0
      ? `${formatNumber(total)}+ free coloring pages to print or color online`
      : settings.site.tagline;

  return (
    <HeaderNav
      siteName={settings.site.name}
      tagline={tagline}
      categories={categories.map(({ slug, name, color }) => ({ slug, name, color }))}
    />
  );
}
