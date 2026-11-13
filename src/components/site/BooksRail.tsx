import { getBooks } from '@/lib/queries';
import { BookCard } from './BookCard';
import { SectionHeading } from '@/components/ui/Section';
import { cn } from '@/lib/utils';

/**
 * A short shelf of coloring books, dropped at the foot of the browse pages.
 *
 * It is how a crawler (and a parent) finds the books at all: nothing else on
 * /coloring-pages or /categories points at them. Renders nothing until there
 * is at least one book to show.
 */
export async function BooksRail({ limit = 4, className }: { limit?: number; className?: string }) {
  const books = (await getBooks(limit)).slice(0, limit);
  if (books.length === 0) return null;

  return (
    <section className={cn('mt-14', className)}>
      <SectionHeading
        eyebrow="Print a whole set"
        band="var(--color-butter)"
        title="Coloring books"
        subtitle="Every page in one PDF, ready for the printer."
        href="/books"
        linkLabel="See all books"
      />

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {books.map((book, index) => (
          <BookCard
            key={book.id}
            book={book}
            fallbackKey={book.cover_fallback_key}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}
