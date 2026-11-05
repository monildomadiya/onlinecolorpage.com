import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Compact 1 … 4 5 6 … 20 window around the current page. */
function windowed(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set<number>([1, total, current]);
  for (const offset of [-1, 1]) {
    const candidate = current + offset;
    if (candidate > 1 && candidate < total) pages.add(candidate);
  }
  if (current <= 3) pages.add(2).add(3);
  if (current >= total - 2) pages.add(total - 1).add(total - 2);

  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const out: (number | 'gap')[] = [];
  sorted.forEach((page, i) => {
    if (i > 0 && page - sorted[i - 1] > 1) out.push('gap');
    out.push(page);
  });
  return out;
}

export function Pagination({
  page,
  totalPages,
  /** Builds the href for a page number, so each route keeps its own filters. */
  hrefFor,
  className,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const items = windowed(page, totalPages);
  // Shared glass treatment for every chip that is not the current page.
  const rest =
    'border border-ink/10 bg-white text-grape-700 hover:-translate-y-0.5 hover:bg-cream-deep';
  const muted = 'border border-ink/10 bg-white text-ink-soft/35';
  const chip =
    'grid tap-big place-items-center rounded-full font-display text-sm font-extrabold transition';

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex flex-wrap items-center justify-center gap-2', className)}
    >
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          rel="prev"
          aria-label="Previous page"
          className={cn(chip, rest)}
        >
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
      ) : (
        <span aria-hidden className={cn(chip, muted)}>
          <ChevronLeft className="size-5" />
        </span>
      )}

      {items.map((item, i) =>
        item === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 font-extrabold text-ink-soft/50">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={hrefFor(item)}
            aria-current={item === page ? 'page' : undefined}
            className={cn(chip, item === page ? 'border border-ink/10 bg-coral text-white' : rest)}
          >
            {item}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} rel="next" aria-label="Next page" className={cn(chip, rest)}>
          <ChevronRight className="size-5" aria-hidden />
        </Link>
      ) : (
        <span aria-hidden className={cn(chip, muted)}>
          <ChevronRight className="size-5" />
        </span>
      )}
    </nav>
  );
}
