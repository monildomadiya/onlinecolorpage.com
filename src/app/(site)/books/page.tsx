import type { Metadata } from 'next';
import { BookOpen } from 'lucide-react';
import { getBooks } from '@/lib/queries';
import { siteUrl } from '@/lib/seo/metadata';
import { booksIndexSchema } from '@/lib/seo/jsonld';
import { BookCard } from '@/components/site/BookCard';
import { JsonLd } from '@/components/site/JsonLd';
import { AdSlot } from '@/components/site/AdSlot';
import { Breadcrumbs, EmptyState } from '@/components/ui/Section';
import { ButtonLink } from '@/components/ui/Button';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Free Printable Coloring Books - Whole Sets as One PDF',
  description:
    'Download a whole coloring book as a single printable PDF. Each book is a hand-picked set of free coloring pages for kids, sized for A4 with safe margins.',
  alternates: { canonical: siteUrl('/books') },
};

export default async function BooksRoute() {
  const books = await getBooks();
  const pages = books.reduce((sum, book) => sum + book.page_count, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-6">
      <JsonLd data={booksIndexSchema(books)} />

      <Breadcrumbs
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Coloring books', path: '/books' },
        ]}
      />

      <header className="mb-8">
        <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">
          Coloring books
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold text-ink-soft sm:text-base">
          {books.length > 0
            ? `${books.length} book${books.length === 1 ? '' : 's'} and ${pages} pages, each one a single PDF you can print in one go.`
            : 'Whole sets of coloring pages, gathered into one printable PDF each.'}
        </p>
      </header>

      <AdSlot slot="header" className="mb-6" />

      {books.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No coloring books yet"
          message="There is still plenty to colour - every page on the site is free to print one at a time."
          action={
            <ButtonLink href="/coloring-pages" tone="grape">
              Browse coloring pages
            </ButtonLink>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {books.map((book, index) => (
            <BookCard
              key={book.id}
              book={book}
              fallbackKey={book.cover_fallback_key}
              index={index}
              priority={index < 4}
            />
          ))}
        </div>
      )}

      <AdSlot slot="page_bottom" />
    </div>
  );
}
