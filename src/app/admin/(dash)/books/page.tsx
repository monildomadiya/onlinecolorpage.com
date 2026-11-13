import Link from 'next/link';
import { Plus } from 'lucide-react';
import { listBooks } from '@/lib/admin/queries';
import { publicUrl } from '@/lib/r2/public';
import { PageHeader } from '@/components/admin/AdminShell';
import { BooksTable } from '@/components/admin/BooksTable';
import { AdminButton, Alert } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

export default async function AdminBooksList({ searchParams }: Props) {
  const [sp, books] = await Promise.all([searchParams, listBooks()]);

  // Resolve covers server-side so the table stays R2-agnostic.
  const coverFor = Object.fromEntries(
    books.map((book) => [book.id, book.cover_key ? publicUrl(book.cover_key) : '']),
  );

  return (
    <>
      <PageHeader
        title="Coloring books"
        description={`${books.length} book${books.length === 1 ? '' : 's'}. Each one is an ordered set of pages that downloads as a single PDF.`}
        action={
          <Link href="/admin/books/new">
            <AdminButton>
              <Plus className="size-4" aria-hidden />
              New book
            </AdminButton>
          </Link>
        }
      />

      {one(sp.deleted) === '1' && <Alert tone="success">Book deleted.</Alert>}

      <div className="mt-4">
        <BooksTable books={books} coverFor={coverFor} />
      </div>
    </>
  );
}
