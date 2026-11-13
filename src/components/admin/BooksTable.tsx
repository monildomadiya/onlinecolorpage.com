import Link from 'next/link';
import { Download, ExternalLink, Pencil } from 'lucide-react';
import { Badge, EmptyRow } from './ui';
import { formatDate, formatNumber } from '@/lib/utils';
import type { Book } from '@/types/db';

/**
 * The book list. No bulk bar: a book is a handful of rows at most, and
 * publishing one is a decision you make inside it, with its pages in view.
 */
export function BooksTable({
  books,
  coverFor,
}: {
  books: (Book & { page_count: number })[];
  /** Resolved on the server so this component never touches R2 config. */
  coverFor: Record<string, string>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-extrabold tracking-wide text-slate-500 uppercase">
            <tr>
              <th scope="col" className="px-4 py-3">
                Book
              </th>
              <th scope="col" className="px-3 py-3">
                Pages
              </th>
              <th scope="col" className="px-3 py-3">
                Status
              </th>
              <th scope="col" className="px-3 py-3">
                Downloads
              </th>
              <th scope="col" className="px-3 py-3">
                Added
              </th>
              <th scope="col" className="px-3 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {books.length === 0 ? (
              <EmptyRow colSpan={6} message="No coloring books yet." />
            ) : (
              books.map((book) => (
                <tr key={book.id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {coverFor[book.id] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={coverFor[book.id]}
                          alt=""
                          className="size-11 shrink-0 rounded-lg border border-slate-200 bg-white object-contain p-0.5"
                        />
                      ) : (
                        <span
                          aria-hidden
                          className="grid size-11 shrink-0 place-items-center rounded-lg border border-dashed border-slate-300 text-slate-300"
                        >
                          📕
                        </span>
                      )}
                      <div className="min-w-0">
                        <Link
                          href={`/admin/books/${book.id}`}
                          className="block max-w-72 truncate font-bold text-slate-800 hover:text-violet-600"
                        >
                          {book.title}
                        </Link>
                        <p className="max-w-72 truncate font-mono text-[11px] text-slate-400">
                          /book/{book.slug}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-3 text-xs font-bold text-slate-600">
                    {book.page_count}
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge tone={book.is_published ? 'green' : 'amber'}>
                        {book.is_published ? 'Live' : 'Draft'}
                      </Badge>
                      {book.is_featured && <Badge tone="violet">★</Badge>}
                      {!book.pdf_key && <Badge tone="slate">no pdf</Badge>}
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500">
                      <Download className="size-3.5" aria-hidden />
                      {formatNumber(book.download_count)}
                    </span>
                  </td>

                  <td className="px-3 py-3 text-xs whitespace-nowrap text-slate-500">
                    {formatDate(book.created_at)}
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/book/${book.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open on the site"
                        className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <ExternalLink className="size-4" aria-hidden />
                        <span className="sr-only">View {book.title}</span>
                      </Link>
                      <Link
                        href={`/admin/books/${book.id}`}
                        title="Edit"
                        className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-violet-50 hover:text-violet-600"
                      >
                        <Pencil className="size-4" aria-hidden />
                        <span className="sr-only">Edit {book.title}</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
