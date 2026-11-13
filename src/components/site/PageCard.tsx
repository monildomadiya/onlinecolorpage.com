import Image from 'next/image';
import Link from 'next/link';
import { Eye, ImageOff } from 'lucide-react';
import { publicUrl } from '@/lib/r2/public';
import { frameStyle } from '@/lib/frames';
import { cn, formatNumber } from '@/lib/utils';
import type { ColoringPageCard, Difficulty } from '@/types/db';

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Tricky',
};

export function PageCard({
  page,
  index = 0,
  priority = false,
  className,
}: {
  page: ColoringPageCard;
  /** Position in the grid - decides which frame colour the card wears. */
  index?: number;
  priority?: boolean;
  className?: string;
}) {
  const src = publicUrl(page.thumb_key ?? page.image_key);

  return (
    <article className={cn('frame-card group', className)} style={frameStyle(index)}>
      <Link href={`/color/${page.slug}`} className="flex flex-1 flex-col focus-visible:outline-none">
        <div className="frame-media aspect-[4/5]">
          <span className="frame-tag">{DIFFICULTY_LABEL[page.difficulty]}</span>

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
            <div className="grid size-full place-items-center text-ink-soft/25" aria-hidden>
              <ImageOff className="size-10" />
            </div>
          )}

          {page.view_count > 0 && (
            <span className="absolute bottom-1.5 left-2 inline-flex items-center gap-1 text-[0.62rem] font-extrabold text-ink-soft/55">
              <Eye className="size-3" aria-hidden />
              {formatNumber(page.view_count)}
            </span>
          )}
        </div>

        <h3 className="frame-label line-clamp-2">{page.title}</h3>
      </Link>
    </article>
  );
}

/** Matching placeholder used while a grid streams in. */
export function PageCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div className="frame-card" style={frameStyle(index)}>
      <div className="skeleton aspect-[4/5]" />
      <div className="frame-label">&nbsp;</div>
    </div>
  );
}
