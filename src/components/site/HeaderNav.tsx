'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Flame, Grid3x3, Home, LayoutGrid, Menu, Search, Sparkles, X } from 'lucide-react';
import { SearchBox } from './SearchBox';
import { CrayonMark } from '@/components/ui/Decor';
import { cn } from '@/lib/utils';

export interface NavCategory {
  slug: string;
  name: string;
  color: string | null;
}

const LINKS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/coloring-pages', label: 'Coloring pages', icon: LayoutGrid },
  { href: '/categories', label: 'Categories', icon: Grid3x3 },
  { href: '/popular', label: 'Most loved', icon: Flame },
] as const;

/** The six crayon colours the wordmark cycles through, letter by letter. */
const LETTER_TONES = [
  'var(--color-coral-soft)',
  'var(--color-butter)',
  'var(--color-mint)',
  'var(--color-sky)',
  'var(--color-lilac)',
  'var(--color-leaf)',
];

/**
 * The wordmark, spelled out one letter at a time so each one can take the
 * next colour in the crayon box. Screen readers get the plain string from the
 * link's aria-label, so the split letters are hidden from them.
 */
function Wordmark({ text }: { text: string }) {
  let letterIndex = 0;

  return (
    <span aria-hidden className="font-display text-[1.35rem] leading-none sm:text-[1.6rem]">
      {text.split('').map((char, i) => {
        if (char === ' ') return <span key={i}>&nbsp;</span>;
        const tone = LETTER_TONES[letterIndex % LETTER_TONES.length];
        letterIndex += 1;
        return (
          <span key={i} style={{ color: tone }}>
            {char}
          </span>
        );
      })}
    </span>
  );
}

export function HeaderNav({
  siteName,
  tagline,
  categories,
}: {
  siteName: string;
  tagline: string;
  categories: NavCategory[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {tagline && (
        <p className="topbar no-print">
          <Sparkles className="mr-1.5 -mt-0.5 inline size-3.5" aria-hidden />
          {tagline}
        </p>
      )}

      {/* The bar itself is just tinted page; the nav floats inside it as a
          white capsule, the way a sticker sits on the paper. */}
      <header className="sticky top-0 z-50 bg-cream/85 backdrop-blur-md">
        <div className="mx-auto flex h-[var(--nav-h)] max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2"
            aria-label={`${siteName} home`}
          >
            <span className="grid size-10 place-items-center rounded-2xl bg-coral text-white shadow-[var(--shadow-pill)]">
              <CrayonMark className="size-5.5" />
            </span>
            <Wordmark text="Online Color Page" />
          </Link>

          <nav
            aria-label="Main"
            className="mx-auto hidden items-center gap-1 rounded-full border border-edge bg-white/90 px-2 py-1.5 shadow-[var(--shadow-card)] lg:flex"
          >
            {LINKS.map(({ href, label, icon: Icon }) => {
              const active =
                href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-coral/12 text-coral'
                      : 'text-ink-soft hover:bg-cream hover:text-ink',
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {/* Search collapses to a round chip, so the bar stays type-only
                until you ask for a control. */}
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label={searchOpen ? 'Close search' : 'Open search'}
              aria-expanded={searchOpen}
              className="tap-big hidden place-items-center rounded-full border border-edge bg-white text-ink-soft shadow-[var(--shadow-card)] transition hover:text-coral md:grid"
            >
              {searchOpen ? <X className="size-5" /> : <Search className="size-5" />}
            </button>

            <Link
              href="/coloring-pages"
              className="btn-kid hidden px-5 py-2.5 text-sm md:inline-flex"
            >
              Start coloring
            </Link>

            <button
              type="button"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="tap-big grid place-items-center rounded-full border border-edge bg-white text-ink shadow-[var(--shadow-card)] transition hover:text-coral lg:hidden"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Desktop search drawer */}
        {searchOpen && (
          <div className="hidden md:block">
            <div className="mx-auto max-w-2xl px-4 pb-3 sm:px-6">
              <SearchBox placeholder="Search coloring pages..." autoFocus />
            </div>
          </div>
        )}

        {/* Mobile drawer */}
        <div
          className={cn(
            'overflow-hidden transition-[max-height] duration-300 lg:hidden',
            open ? 'max-h-[80dvh] overflow-y-auto' : 'max-h-0',
          )}
        >
          <div className="mx-4 mb-4 space-y-5 rounded-[var(--radius-panel)] border border-edge bg-white p-4 shadow-[var(--shadow-panel)] sm:mx-6">
            <SearchBox autoFocus={false} />

            <nav aria-label="Sections" className="flex flex-col gap-1">
              {LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 text-base font-medium text-ink transition hover:bg-cream"
                >
                  <span className="grid size-9 place-items-center rounded-xl bg-cream text-coral">
                    <Icon className="size-4.5" aria-hidden />
                  </span>
                  {label}
                </Link>
              ))}
            </nav>

            {categories.length > 0 && (
              <div>
                <p className="mb-3 font-display text-sm text-ink">Categories</p>
                <ul className="grid grid-cols-2 gap-2">
                  {categories.map((category) => {
                    const accent = category.color ?? 'var(--color-mint)';
                    return (
                      <li key={category.slug}>
                        <Link
                          href={`/category/${category.slug}`}
                          className="flex items-center gap-2 rounded-full px-3 py-2.5 text-sm font-medium text-ink"
                          style={{ background: `color-mix(in srgb, ${accent} 22%, white)` }}
                        >
                          <span className="truncate">{category.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <Link href="/coloring-pages" className="btn-kid w-full">
              Start coloring
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
