import Image from 'next/image';
import Link from 'next/link';
import { publicUrl } from '@/lib/r2/public';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/db';

const FALLBACK = 'var(--color-mint)';

/**
 * A category keeps its own colour wherever it turns up. In the flat system
 * that colour fills the sheet behind the initial rather than outlining it -
 * the card itself stays a plain white rectangle with the name printed below.
 */
export function CategoryCard({
  category,
  count,
  className,
}: {
  category: Category;
  count?: number;
  className?: string;
}) {
  const accent = category.color ?? FALLBACK;
  const cover = publicUrl(category.cover_key);

  return (
    <Link
      href={`/category/${category.slug}`}
      className={cn('frame-card group focus-visible:outline-none', className)}
    >
      <div className="frame-media grid aspect-[5/3] place-items-center">
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          />
        ) : (
          <span
            aria-hidden
            className="grid size-full place-items-center font-display text-5xl text-ink/80 transition-transform duration-500 group-hover:scale-105"
            style={{ background: `color-mix(in srgb, ${accent} 38%, white)` }}
          >
            {category.name.charAt(0).toUpperCase()}
          </span>
        )}

        {typeof count === 'number' && cover && (
          <span className="frame-tag">
            {count} page{count === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <h3 className="frame-label">
        {category.name}
        {typeof count === 'number' && !cover && (
          <span className="mt-0.5 block text-xs text-ink-soft">
            {count} page{count === 1 ? '' : 's'}
          </span>
        )}
      </h3>
    </Link>
  );
}

/** Horizontally scrolling chip rail - the quickest way in on a phone. */
export function CategoryRail({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      {categories.map((category) => {
        const accent = category.color ?? FALLBACK;
        return (
          <Link
            key={category.slug}
            href={`/category/${category.slug}`}
            className="shrink-0 rounded-[var(--radius-btn)] px-4 py-2.5 text-sm font-medium whitespace-nowrap text-ink transition hover:-translate-y-0.5"
            style={{ background: `color-mix(in srgb, ${accent} 38%, white)` }}
          >
            {category.name}
          </Link>
        );
      })}
    </div>
  );
}
