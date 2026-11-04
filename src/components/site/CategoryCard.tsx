import Image from 'next/image';
import Link from 'next/link';
import { publicUrl } from '@/lib/r2/public';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/db';

export function CategoryCard({
  category,
  count,
  className,
}: {
  category: Category;
  count?: number;
  className?: string;
}) {
  const accent = category.color ?? '#8b4ff5';
  const cover = publicUrl(category.cover_key);

  return (
    <Link
      href={`/category/${category.slug}`}
      className={cn(
        'card-kid card-hover group relative flex flex-col overflow-hidden focus-visible:outline-none',
        className,
      )}
    >
      <div
        className="relative grid aspect-[5/3] place-items-center overflow-hidden"
        style={{ background: `linear-gradient(140deg, ${accent}26, ${accent}0d)` }}
      >
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span
            aria-hidden
            className="text-5xl drop-shadow-sm transition-transform duration-300 group-hover:scale-115 group-hover:rotate-6 sm:text-6xl"
          >
            {category.emoji ?? '🎨'}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-lg leading-tight font-extrabold text-ink">
          {category.name}
        </h3>
        {category.description && (
          <p className="mt-1 text-xs leading-relaxed text-ink-soft line-clamp-2">
            {category.description}
          </p>
        )}
        <span
          className="mt-3 inline-flex w-fit rounded-full px-3 py-1 font-display text-xs font-extrabold"
          style={{ background: `${accent}1f`, color: accent }}
        >
          {typeof count === 'number' ? `${count} page${count === 1 ? '' : 's'}` : 'Explore'}
        </span>
      </div>
    </Link>
  );
}

/** Horizontally scrolling chip rail - the quickest way in on a phone. */
export function CategoryRail({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      {categories.map((category) => {
        const accent = category.color ?? '#8b4ff5';
        return (
          <Link
            key={category.slug}
            href={`/category/${category.slug}`}
            className="flex shrink-0 items-center gap-2 rounded-2xl border-2 bg-white px-4 py-2.5 font-display text-sm font-extrabold whitespace-nowrap transition hover:-translate-y-0.5"
            style={{ borderColor: `${accent}40`, color: accent }}
          >
            <span aria-hidden className="text-lg">
              {category.emoji ?? '🎨'}
            </span>
            {category.name}
          </Link>
        );
      })}
    </div>
  );
}
