import Link from 'next/link';
import { Mail } from 'lucide-react';
import { getCategories } from '@/lib/queries';
import { getSettings } from '@/lib/settings';
import { CrayonMark } from '@/components/ui/Decor';
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
    /* The last band on the page, a warm sand that closes the colour run. */
    <footer className="mt-20 bg-sand text-ink">
      <div className="mx-auto max-w-7xl px-4 pt-14 pb-10 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="grid size-11 place-items-center rounded-xl bg-coral text-white">
                <CrayonMark className="size-6" />
              </span>
              <span className="font-display text-xl text-ink">{site.name}</span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-soft">
              {site.description}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap-big grid place-items-center rounded-xl text-ink-soft transition hover:bg-ink hover:text-cream"
                >
                  <Icon className="size-5" />
                </a>
              ))}
              {site.email && (
                <a
                  href={`mailto:${site.email}`}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-ink-soft transition hover:bg-ink hover:text-cream"
                >
                  <Mail className="size-4" aria-hidden />
                  {site.email}
                </a>
              )}
            </div>
          </div>

          <nav aria-label="Categories">
            <h2 className="text-base font-semibold text-ink">Categories</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {categories.slice(0, 8).map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/category/${category.slug}`}
                    className="text-ink-soft transition hover:text-ink"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/categories" className="font-semibold text-ink hover:underline">
                  Explore all categories
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Help">
            <h2 className="text-base font-semibold text-ink">Help</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {HELP_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-ink-soft transition hover:text-ink">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-center gap-3 border-t border-ink/10 pt-6 text-center text-xs text-ink-soft sm:flex-row sm:justify-between sm:text-left">
          <p>
            © {year} {site.name}. Free for personal &amp; classroom use.
          </p>
          <p>Made for little artists everywhere.</p>
        </div>
      </div>
    </footer>
  );
}
