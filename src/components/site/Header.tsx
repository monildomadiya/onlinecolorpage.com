import { getCategories } from '@/lib/queries';
import { getSettings } from '@/lib/settings';
import { HeaderNav } from './HeaderNav';

/** Server wrapper: fetches the nav data, hands it to the interactive shell. */
export async function Header() {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);

  return (
    <HeaderNav
      siteName={settings.site.name}
      categories={categories.map(({ slug, name, emoji, color }) => ({ slug, name, emoji, color }))}
    />
  );
}
