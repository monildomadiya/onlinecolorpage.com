import { PageCard, PageCardSkeleton } from './PageCard';
import { AdSlot } from './AdSlot';
import { cn } from '@/lib/utils';
import type { ColoringPageWithCategory } from '@/types/db';

const GRID = 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';

export function PageGrid({
  pages,
  className,
  /** Drop an in-grid ad after this many cards (0 = never). */
  adAfter = 0,
  priorityCount = 4,
}: {
  pages: ColoringPageWithCategory[];
  className?: string;
  adAfter?: number;
  priorityCount?: number;
}) {
  if (pages.length === 0) return null;

  const head = adAfter > 0 ? pages.slice(0, adAfter) : pages;
  const tail = adAfter > 0 ? pages.slice(adAfter) : [];

  return (
    <>
      <div className={cn(GRID, className)}>
        {head.map((page, i) => (
          <PageCard key={page.id} page={page} priority={i < priorityCount} />
        ))}
      </div>

      {tail.length > 0 && (
        <>
          <AdSlot slot="grid_inline" className="my-8" />
          <div className={cn(GRID, className)}>
            {tail.map((page) => (
              <PageCard key={page.id} page={page} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

export function PageGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className={GRID}>
      {Array.from({ length: count }, (_, i) => (
        <PageCardSkeleton key={i} />
      ))}
    </div>
  );
}
