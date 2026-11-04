'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, Palette, Sparkles, Star, X } from 'lucide-react';
import { SearchBox } from './SearchBox';
import { cn } from '@/lib/utils';

export interface NavCategory {
  slug: string;
  name: string;
  emoji: string | null;
  color: string | null;
}

const LINKS = [
  { href: '/coloring-pages', label: 'All Pages', icon: Palette },
  { href: '/categories', label: 'Categories', icon: Star },
  { href: '/popular', label: 'Most Loved', icon: Sparkles },
] as const;

export function HeaderNav({
  siteName,
  categories,
}: {
  siteName: string;
  categories: NavCategory[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the drawer on navigation and lock scroll while it is open.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b-4 border-grape-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-[var(--nav-h)] max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2"
          aria-label={`${siteName} home`}
        >
          <span className="grid size-10 place-items-center rounded-2xl bg-grape-500 text-xl shadow-[0_4px_0_var(--color-grape-700)]">
            🖍️
          </span>
          <span className="font-display text-lg leading-none font-extrabold text-ink sm:text-xl">
            Online
            <br />
            <span className="text-grape-600">Color Page</span>
          </span>
        </Link>

        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 lg:flex">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-extrabold transition-colors',
                  active
                    ? 'bg-grape-100 text-grape-700'
                    : 'text-ink-soft hover:bg-cream-deep hover:text-ink',
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto hidden max-w-xs flex-1 md:block">
          <SearchBox placeholder="Search coloring pages..." />
        </div>

        <Link href="/coloring-pages" className="btn-kid btn-sunny ml-auto hidden md:ml-2 md:inline-flex">
          Start Coloring
        </Link>

        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="tap-big ml-auto grid place-items-center rounded-2xl bg-grape-100 text-grape-700 lg:hidden"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          'overflow-hidden border-t-2 border-grape-100 bg-white transition-[max-height] duration-300 lg:hidden',
          open ? 'max-h-[80dvh] overflow-y-auto' : 'max-h-0',
        )}
      >
        <div className="space-y-4 px-4 py-4">
          <SearchBox autoFocus={false} />

          <div className="grid grid-cols-2 gap-2">
            {LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 rounded-2xl bg-cream-deep px-4 py-3 font-extrabold text-ink"
              >
                <Icon className="size-4 text-grape-600" aria-hidden />
                {label}
              </Link>
            ))}
          </div>

          {categories.length > 0 && (
            <div>
              <p className="mb-2 font-display text-sm font-extrabold tracking-wide text-ink-soft uppercase">
                Categories
              </p>
              <ul className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={`/category/${category.slug}`}
                      className="flex items-center gap-2 rounded-2xl px-3 py-2.5 font-bold text-ink"
                      style={{ background: `${category.color ?? '#8b4ff5'}1a` }}
                    >
                      <span aria-hidden className="text-lg">
                        {category.emoji ?? '🎨'}
                      </span>
                      <span className="truncate text-sm">{category.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
