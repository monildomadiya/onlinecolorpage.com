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

const EXPLORE_LINKS = [
  { href: '/coloring-pages', label: 'All coloring pages' },
  { href: '/categories', label: 'Browse themes' },
  { href: '/popular', label: 'Most loved' },
  { href: '/my-art', label: 'My sticker book' },
  { href: '/search', label: 'Search' },
];

/** Tiny uppercase column header; each column gets its own crayon colour. */
function ColumnTitle({ children, tone }: { children: React.ReactNode; tone: string }) {
  return (
    <h2
      className="flex items-center gap-2 text-[0.7rem] font-semibold tracking-[0.16em] uppercase"
      style={{ color: tone }}
    >
      <span aria-hidden className="size-2 rounded-full" style={{ background: tone }} />
      {children}
    </h2>
  );
}

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
    /* No band of its own: the footer is the same peach paper as the rest of
       the page, separated by a hairline rather than a change of colour. */
    <footer className="mt-10 border-t border-edge text-ink">
      <div className="mx-auto max-w-7xl px-4 pt-14 pb-10 sm:px-6">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="grid size-11 place-items-center rounded-2xl bg-coral text-white shadow-[var(--shadow-pill)]">
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
                  className="tap-big grid place-items-center rounded-full border border-edge bg-white text-ink-soft shadow-[var(--shadow-card)] transition hover:text-coral"
                >
                  <Icon className="size-5" />
                </a>
              ))}
              {site.email && (
                <a
                  href={`mailto:${site.email}`}
                  className="flex items-center gap-2 rounded-full border border-edge bg-white px-4 py-2.5 text-sm text-ink-soft shadow-[var(--shadow-card)] transition hover:text-coral"
                >
                  <Mail className="size-4" aria-hidden />
                  {site.email}
                </a>
              )}
            </div>
          </div>

          <nav aria-label="Categories">
            <ColumnTitle tone="var(--color-blush-dark)">Themes</ColumnTitle>
            <ul className="mt-4 space-y-2.5 text-sm">
              {categories.slice(0, 8).map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/category/${category.slug}`}
                    className="text-ink-soft transition hover:text-coral"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/categories" className="font-semibold text-ink hover:text-coral">
                  Explore all themes
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Explore">
            <ColumnTitle tone="var(--color-sky-dark)">Explore</ColumnTitle>
            <ul className="mt-4 space-y-2.5 text-sm">
              {EXPLORE_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-ink-soft transition hover:text-coral">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Help">
            <ColumnTitle tone="var(--color-mint-dark)">Help</ColumnTitle>
            <ul className="mt-4 space-y-2.5 text-sm">
              {HELP_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-ink-soft transition hover:text-coral">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-center gap-3 border-t border-edge pt-6 text-center text-xs text-ink-soft sm:flex-row sm:justify-between sm:text-left">
          <p>
            © {year} {site.name}. Free for personal &amp; classroom use.
          </p>
          <p>Made for little artists everywhere 🖍️</p>
        </div>
      </div>
    </footer>
  );
}
