'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Flame, Grid3x3, LayoutGrid, Menu, Search, X } from 'lucide-react';
import { SearchBox } from './SearchBox';
import { CrayonMark } from '@/components/ui/Decor';
import { cn } from '@/lib/utils';

export interface NavCategory {
  slug: string;
  name: string;
  color: string | null;
}

const LINKS = [
  { href: '/coloring-pages', label: 'Explore coloring pages', icon: LayoutGrid },
  { href: '/categories', label: 'Categories', icon: Grid3x3 },
  { href: '/popular', label: 'Most loved', icon: Flame },
] as const;

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
      {tagline && <p className="topbar no-print">{tagline}</p>}

      {/* Flat cream bar, hairline rule, nothing floating. */}
      <header className="sticky top-0 z-50 border-b border-ink/8 bg-cream">
        <div className="mx-auto flex h-[var(--nav-h)] max-w-7xl items-center gap-6 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={`${siteName} home`}>
            <span className="grid size-11 place-items-center rounded-xl bg-coral text-white">
              <CrayonMark className="size-6" />
            </span>
            <span className="font-display text-base leading-[1.1] text-ink sm:text-lg">
              Online
              <br />
              Color Page
            </span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
            {LINKS.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'relative py-1 text-[0.95rem] font-medium transition-colors',
                    active ? 'text-ink' : 'text-ink-soft hover:text-ink',
                  )}
                >
                  {label}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute -bottom-0.5 left-0 h-[3px] w-full rounded-full bg-coral"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {/* Search collapses to an icon, the way the rest of the bar stays
                type-only until you ask for a control. */}
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label={searchOpen ? 'Close search' : 'Open search'}
              aria-expanded={searchOpen}
              className="tap-big hidden place-items-center rounded-xl text-ink-soft transition hover:bg-cream-deep hover:text-ink md:grid"
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
              className="tap-big grid place-items-center rounded-xl text-ink transition hover:bg-cream-deep lg:hidden"
            >
              {open ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>

        {/* Desktop search drawer */}
        {searchOpen && (
          <div className="hidden border-t border-ink/8 bg-cream md:block">
            <div className="mx-auto max-w-2xl px-4 py-3 sm:px-6">
              <SearchBox placeholder="Search coloring pages..." autoFocus />
            </div>
          </div>
        )}

        {/* Mobile drawer */}
        <div
          className={cn(
            'overflow-hidden border-t bg-cream transition-[max-height] duration-300 lg:hidden',
            open ? 'max-h-[80dvh] overflow-y-auto border-ink/8' : 'max-h-0 border-transparent',
          )}
        >
          <div className="space-y-5 px-4 py-4">
            <SearchBox autoFocus={false} />

            <nav aria-label="Sections" className="flex flex-col">
              {LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 border-b border-ink/8 py-3.5 text-base font-medium text-ink"
                >
                  <Icon className="size-4.5 text-coral" aria-hidden />
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
                          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-ink"
                          style={{ background: `color-mix(in srgb, ${accent} 38%, white)` }}
                        >
                          <span className="truncate">{category.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
