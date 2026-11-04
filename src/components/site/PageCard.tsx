import Image from 'next/image';
import Link from 'next/link';
import { Download, Eye, Palette } from 'lucide-react';
import { publicUrl } from '@/lib/r2/public';
import { ageLabel, cn, formatNumber } from '@/lib/utils';
import type { ColoringPageWithCategory, Difficulty } from '@/types/db';

const DIFFICULTY_STYLE: Record<Difficulty, { label: string; className: string }> = {
  easy: { label: 'Easy', className: 'bg-mint/20 text-mint-dark' },
  medium: { label: 'Medium', className: 'bg-sunny/25 text-sunny-dark' },
  hard: { label: 'Tricky', className: 'bg-coral/20 text-coral-dark' },
};

export function PageCard({
  page,
  priority = false,
  className,
}: {
  page: ColoringPageWithCategory;
  priority?: boolean;
  className?: string;
}) {
  const src = publicUrl(page.thumb_key ?? page.image_key);
  const accent = page.category?.color ?? '#8b4ff5';
  const difficulty = DIFFICULTY_STYLE[page.difficulty];

  return (
    <article className={cn('card-kid card-hover group relative overflow-hidden', className)}>
      <Link href={`/color/${page.slug}`} className="block focus-visible:outline-none">
        <div
          className="relative aspect-[4/5] overflow-hidden rounded-t-[1.75rem] bg-white"
          style={{ boxShadow: `inset 0 0 0 4px ${accent}1f` }}
        >
          {src ? (
            <Image
              src={src}
              alt={`${page.title} coloring page`}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="grid size-full place-items-center text-5xl" aria-hidden>
              🎨
            </div>
          )}

          {page.is_featured && (
            <span className="absolute top-2.5 left-2.5 rounded-full bg-sunny px-2.5 py-1 font-display text-[11px] font-extrabold text-ink shadow-sm">
              ⭐ Top pick
            </span>
          )}

          <span
            className={cn(
              'absolute top-2.5 right-2.5 rounded-full px-2.5 py-1 font-display text-[11px] font-extrabold',
              difficulty.className,
            )}
          >
            {difficulty.label}
          </span>

          {/* Hover/focus call-to-action - also visible on touch via the buttons below */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden translate-y-2 justify-center bg-gradient-to-t from-white via-white/90 to-transparent pt-8 pb-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:flex">
            <span className="btn-kid pointer-events-auto rounded-xl px-4 py-2 text-sm">
              <Palette className="size-4" aria-hidden /> Color it!
            </span>
          </div>
        </div>

        <div className="p-3.5 pb-2">
          <h3 className="font-display text-base leading-tight font-extrabold text-ink line-clamp-2">
            {page.title}
          </h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-bold text-ink-soft/80">
            {page.category && (
              <span className="inline-flex items-center gap-1">
                <span aria-hidden>{page.category.emoji ?? '🎨'}</span>
                {page.category.name}
              </span>
            )}
            <span>{ageLabel(page.age_min, page.age_max)}</span>
          </div>
        </div>
      </Link>

      <div className="flex items-center justify-between border-t-2 border-cream-deep px-3.5 py-2 text-[11px] font-bold text-ink-soft/70">
        <span className="inline-flex items-center gap-1" title={`${page.view_count} views`}>
          <Eye className="size-3.5" aria-hidden />
          {formatNumber(page.view_count)}
        </span>
        <span className="inline-flex items-center gap-1" title={`${page.color_count} colorings`}>
          <Palette className="size-3.5" aria-hidden />
          {formatNumber(page.color_count)}
        </span>
        <span className="inline-flex items-center gap-1" title={`${page.download_count} downloads`}>
          <Download className="size-3.5" aria-hidden />
          {formatNumber(page.download_count)}
        </span>
      </div>
    </article>
  );
}

/** Matching placeholder used while a grid streams in. */
export function PageCardSkeleton() {
  return (
    <div className="card-kid overflow-hidden">
      <div className="skeleton aspect-[4/5] rounded-t-[1.75rem]" />
      <div className="space-y-2 p-3.5">
        <div className="skeleton h-4 w-4/5 rounded-full" />
        <div className="skeleton h-3 w-2/5 rounded-full" />
      </div>
    </div>
  );
}
