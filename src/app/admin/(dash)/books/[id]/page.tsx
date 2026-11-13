import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getBookById, getBookContents, listCategories } from '@/lib/admin/queries';
import { getSession, hasRole } from '@/lib/auth';
import { publicUrl } from '@/lib/r2/public';
import { MAX_BOOK_PAGES } from '@/lib/pdf';
import { PageHeader } from '@/components/admin/AdminShell';
import { EditBookForm } from '@/components/admin/EditBookForm';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EditBookRoute({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;

  const book = await getBookById(id);
  if (!book) notFound();

  const [contents, categories, session] = await Promise.all([
    getBookContents(book.id),
    listCategories(),
    getSession(),
  ]);

  // The picker speaks in display rows, not database rows.
  const picked = contents.map((page) => ({
    id: page.id,
    title: page.title,
    slug: page.slug,
    thumbUrl: publicUrl(page.thumb_key ?? page.image_key),
    isPublished: page.is_published,
    categoryName: page.category?.name ?? null,
  }));

  return (
    <>
      <Link
        href="/admin/books"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to coloring books
      </Link>

      <PageHeader title={book.title} description={`/book/${book.slug}`} />

      <EditBookForm
        book={book}
        contents={picked}
        categories={categories}
        coverUrl={book.cover_key ? publicUrl(book.cover_key) : null}
        pdfUrl={book.pdf_key ? publicUrl(book.pdf_key) : null}
        maxPages={MAX_BOOK_PAGES}
        canDelete={hasRole(session?.profile, 'admin')}
        justCreated={(Array.isArray(sp.created) ? sp.created[0] : sp.created) === '1'}
      />
    </>
  );
}
