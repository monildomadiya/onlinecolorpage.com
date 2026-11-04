import Link from 'next/link';
import { Mail } from 'lucide-react';
import { getCategories } from '@/lib/queries';
import { getSettings } from '@/lib/settings';
import { WaveDivider } from '@/components/ui/Decor';
import { FacebookIcon, InstagramIcon, PinterestIcon, XIcon } from './BrandIcons';

const HELP_LINKS = [
  { href: '/about', label: 'About us' },
  { href: '/how-to-color', label: 'How to color online' },
  { href: '/demo', label: 'Try the coloring game' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy policy' },
  { href: '/terms', label: 'Terms of use' },
];

export async function Footer() {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  const { site, seo } = settings;
  const year = new Date().getFullYear();

  const socials = [
    { href: seo.facebook, label: 'Facebook', Icon: FacebookIcon },
    { href: seo.instagram, label: 'Instagram', Icon: InstagramIcon },
    { href: seo.twitter, label: 'X', Icon: XIcon },
    { href: seo.pinterest, label: 'Pinterest', Icon: PinterestIcon },
  ].filter((s) => s.href);

  return (
    <footer className="mt-20 bg-grape-600 text-grape-50">
      <WaveDivider fill="var(--color-grape-600)" className="-mt-px -translate-y-full" />

      <div className="mx-auto max-w-7xl px-4 pt-4 pb-10 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="grid size-10 place-items-center rounded-2xl bg-white/15 text-xl">
                🖍️
              </span>
              <span className="font-display text-2xl font-extrabold text-white">{site.name}</span>
            </div>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-grape-100">
              {site.description}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap-big grid place-items-center rounded-2xl bg-white/15 transition hover:bg-white/25"
                >
                  <Icon className="size-5" />
                </a>
              ))}
              {site.email && (
                <a
                  href={`mailto:${site.email}`}
                  className="flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5 text-sm font-bold transition hover:bg-white/25"
                >
                  <Mail className="size-4" aria-hidden />
                  {site.email}
                </a>
              )}
            </div>
          </div>

          <nav aria-label="Categories">
            <h2 className="font-display text-base font-extrabold text-white">Categories</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {categories.slice(0, 8).map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/category/${category.slug}`}
                    className="text-grape-100 transition hover:text-white"
                  >
                    {category.emoji} {category.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/categories" className="font-extrabold text-sunny hover:underline">
                  See all categories →
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Help">
            <h2 className="font-display text-base font-extrabold text-white">Help</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {HELP_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-grape-100 transition hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 border-t border-white/15 pt-6 text-center text-xs text-grape-200 sm:flex-row sm:justify-between sm:text-left">
          <p>
            © {year} {site.name}. Free for personal &amp; classroom use.
          </p>
          <p>Made with 💜 for little artists everywhere.</p>
        </div>
      </div>
    </footer>
  );
}
