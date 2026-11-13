import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookOpen, Images, Printer, Scissors, Sparkles } from 'lucide-react';
import { getBookBySlug, getBooks } from '@/lib/queries';
import { getSettings } from '@/lib/settings';
import { publicUrl } from '@/lib/r2/public';
import { bookPdfUrl } from '@/lib/r2/urls';
import { buildBookMetadata } from '@/lib/seo/metadata';
import { bookSchema, breadcrumbSchema } from '@/lib/seo/jsonld';
import { JsonLd } from '@/components/site/JsonLd';
import { RichText } from '@/components/site/RichText';
import { PageGrid } from '@/components/site/PageGrid';
import { AdSlot } from '@/components/site/AdSlot';
import { Breadcrumbs, Chip, EmptyState, SectionHeading } from '@/components/ui/Section';
import { ButtonLink } from '@/components/ui/Button';

export const revalidate = 600;
export const dynamicParams = true;

interface Props {
  params: Promise<{ slug: string }>;
}

/** Pre-render the book shells; the rest stays on ISR. */
export async function generateStaticParams() {
  const books = await getBooks(100);
  return books.map((book) => ({ slug: book.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBookBySlug(slug);

  if (!book) {
    return { title: 'Coloring book not found', robots: { index: false, follow: true } };
  }

  return buildBookMetadata(book, book.pages.length);
}

const HOW_TO = [
  [Printer, 'Print the whole book on A4 - every page already has safe margins.'],
  [Scissors, 'Or print one page at a time; they work just as well on their own.'],
  [Sparkles, 'Prefer the screen? Tap any page below and colour it in the browser.'],
] as const;

export default async function BookRoute({ params }: Props) {
  const { slug } = await params;
  const [book, settings] = await Promise.all([getBookBySlug(slug), getSettings()]);

  if (!book) notFound();

  const coverKey = book.cover_key ?? book.pages[0]?.thumb_key ?? book.pages[0]?.image_key ?? null;
  const coverUrl = coverKey ? publicUrl(coverKey) : null;
  const canDownload = book.allow_download && settings.features.allow_downloads;

  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Coloring books', path: '/books' },
    { name: book.title, path: `/book/${book.slug}` },
  ];

  return (
    <>
      <JsonLd
        data={[
          bookSchema(
            book,
            book.pages,
            (page) => publicUrl(page.thumb_key ?? page.image_key),
            coverUrl,
          ),
          breadcrumbSchema(trail),
        ]}
      />

      <div className="mx-auto max-w-5xl px-4 pt-5 pb-16 sm:px-6">
        <Breadcrumbs trail={trail} />

        {/* ------------------------ the book itself ------------------------ */}
        <section className="panel grid items-center gap-6 p-5 sm:p-7 md:grid-cols-[16rem_minmax(0,1fr)]">
          <div className="relative mx-auto w-full max-w-64 overflow-hidden rounded-[1.4rem] border border-edge bg-cream">
            <span
              aria-hidden
              className="tape -top-1 left-1/2 -translate-x-1/2 -rotate-2"
              style={{ ['--tape' as string]: 'var(--color-butter)' }}
            />
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt={`${book.title} coloring book cover`}
                className="aspect-[3/4] w-full object-contain p-4"
              />
            ) : (
              <span
                className="grid aspect-[3/4] w-full place-items-center text-ink-soft/25"
                aria-hidden
              >
                <BookOpen className="size-12" />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <p className="eyebrow mb-3">Coloring book</p>

            <h1 className="font-display text-[1.75rem] leading-tight text-ink sm:text-4xl">
              {book.title}
            </h1>

            {book.subtitle && (
              <p className="mt-2 text-sm text-ink-soft sm:text-base">{book.subtitle}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Chip color="var(--color-mint)">
                {book.pages.length} page{book.pages.length === 1 ? '' : 's'}
              </Chip>
              <Chip color="var(--color-sky)">A4 ready</Chip>
              <Chip color="var(--color-butter)">Free to print</Chip>
            </div>

            {book.description && (
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">{book.description}</p>
            )}

            {canDownload && book.pages.length > 0 && (
              <div className="no-print mt-6 flex flex-wrap gap-2">
                <a href={bookPdfUrl(book.slug)} className="btn-kid btn-coral px-6 py-3" download>
                  <Printer className="size-5" aria-hidden />
                  Download the whole book
                </a>
                <ButtonLink href="/books" tone="ghost" size="md">
                  More books
                </ButtonLink>
              </div>
            )}
          </div>
        </section>

        <AdSlot slot="header" className="mt-6" />

        {/* ------------------------ the write-up ------------------------ */}
        {book.body_html && (
          <section className="panel mt-6 p-5 sm:p-8">
            <RichText html={book.body_html} />
          </section>
        )}

        {/* ------------------------ printing ------------------------ */}
        <section
          className="panel panel-wash mt-6 p-5 sm:p-6"
          style={{ ['--wash' as string]: 'var(--color-mint)' }}
          aria-labelledby="how-to-print"
        >
          <h2 id="how-to-print" className="font-display text-lg text-ink">
            How to use this book
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {HOW_TO.map(([Icon, text]) => (
              <li key={text} className="flex gap-2.5 text-sm text-ink-soft">
                <Icon className="mt-0.5 size-4 shrink-0 text-mint-dark" aria-hidden />
                <span className="leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ------------------------ contents ------------------------ */}
        <section className="mt-12">
          <SectionHeading
            icon={Images}
            eyebrow="Inside the book"
            band="var(--color-sky)"
            title="Every page in order"
            subtitle="Tap any one to colour it on screen, or print the whole set above."
          />

          {book.pages.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="This book is still being put together"
              message="Its pages are not ready yet. Have a look at the other books in the meantime."
              action={
                <ButtonLink href="/books" tone="grape">
                  See all books
                </ButtonLink>
              }
            />
          ) : (
            <PageGrid pages={book.pages} adAfter={20} priorityCount={5} />
          )}
        </section>

        <div className="no-print mt-10 text-center">
          <Link href="/books" className="btn-kid btn-ghost px-5 py-2.5 text-sm">
            <BookOpen className="size-4.5" aria-hidden />
            Browse every coloring book
          </Link>
        </div>

        <AdSlot slot="page_bottom" />
      </div>
    </>
  );
}
