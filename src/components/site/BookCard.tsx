import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Download } from 'lucide-react';
import { publicUrl } from '@/lib/r2/public';
import { cn } from '@/lib/utils';
import type { Book } from '@/types/db';

/** Rotates the tape colour so a shelf of books is not one flat repeat. */
const TAPE = [
  'var(--color-butter)',
  'var(--color-mint)',
  'var(--color-sky)',
  'var(--color-blush)',
  'var(--color-lilac)',
] as const;

export function BookCard({
  book,
  /** A page from inside the book, used when no cover was uploaded. */
  fallbackKey,
  index = 0,
  priority = false,
  className,
}: {
  book: Book & { page_count?: number };
  fallbackKey?: string | null;
  index?: number;
  priority?: boolean;
  className?: string;
}) {
  const src = publicUrl(book.cover_key ?? fallbackKey);
  const count = book.page_count ?? book.pdf_pages ?? 0;

  return (
    <article className={cn('panel group relative flex flex-col p-3', className)}>
      <span
        aria-hidden
        className="tape -top-2 left-1/2 -translate-x-1/2 -rotate-2"
        style={{ ['--tape' as string]: TAPE[index % TAPE.length] }}
      />

      <Link href={`/book/${book.slug}`} className="flex flex-1 flex-col focus-visible:outline-none">
        <div className="relative aspect-[3/4] overflow-hidden rounded-[1.4rem] border border-edge bg-cream">
          {src ? (
            <Image
              src={src}
              alt={`${book.title} coloring book cover`}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <span className="grid size-full place-items-center text-ink-soft/25" aria-hidden>
              <BookOpen className="size-10" />
            </span>
          )}
        </div>

        <h3 className="mt-3 line-clamp-2 px-1 font-display text-base leading-snug text-ink">
          {book.title}
        </h3>

        {book.subtitle && (
          <p className="mt-1 line-clamp-2 px-1 text-xs text-ink-soft">{book.subtitle}</p>
        )}

        <p className="mt-auto flex items-center gap-2 px-1 pt-3 text-[0.7rem] font-semibold text-ink-soft/80">
          <span className="inline-flex items-center gap-1">
            <BookOpen className="size-3.5" aria-hidden />
            {count} page{count === 1 ? '' : 's'}
          </span>
          {book.allow_download && (
            <span className="inline-flex items-center gap-1">
              <Download className="size-3.5" aria-hidden />
              PDF
            </span>
          )}
        </p>
      </Link>
    </article>
  );
}
