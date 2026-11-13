'use client';

import Link from 'next/link';
import { useActionState, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ExternalLink,
  FileDown,
  Image as ImageIcon,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react';
import {
  deleteBookAction,
  rebuildBookPdfAction,
  updateBookAction,
} from '@/app/admin/actions/books';
import type { ActionResult } from '@/app/admin/actions/pages';
import { BookPagePicker } from './BookPagePicker';
import { RichTextEditor } from './RichTextEditor';
import { AdminButton, Alert, Badge, Card, Field, Input, Textarea, Toggle } from './ui';
import { formatDateTime, formatNumber, slugify } from '@/lib/utils';
import type { PickerPage } from '@/lib/admin/queries';
import type { Book, Category } from '@/types/db';

const INITIAL: ActionResult = { ok: false, message: '' };

export function EditBookForm({
  book,
  contents,
  categories,
  coverUrl,
  pdfUrl,
  maxPages,
  canDelete,
  justCreated,
}: {
  book: Book;
  contents: PickerPage[];
  categories: Category[];
  coverUrl: string | null;
  pdfUrl: string | null;
  maxPages: number;
  canDelete: boolean;
  justCreated: boolean;
}) {
  const router = useRouter();
  const [state, formAction, saving] = useActionState(updateBookAction, INITIAL);

  const [slug, setSlug] = useState(book.slug);
  const [published, setPublished] = useState(book.is_published);
  const [featured, setFeatured] = useState(book.is_featured);
  const [allowDownload, setAllowDownload] = useState(book.allow_download);
  const [coverPage, setCoverPage] = useState(book.include_cover_page);

  const [notice, setNotice] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const coverInput = useRef<HTMLInputElement>(null);

  async function sendCover(file: File) {
    setUploading(true);
    setNotice(null);

    const form = new FormData();
    form.set('mode', 'bookCover');
    form.set('bookId', book.id);
    form.set('file', file);

    try {
      const response = await fetch('/api/admin/upload', { method: 'POST', body: form });
      const payload = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? `Upload failed (${response.status})`);
      }

      setNotice({ ok: true, message: 'Cover saved.' });
      router.refresh();
    } catch (error) {
      setNotice({ ok: false, message: error instanceof Error ? error.message : 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  }

  function rebuild() {
    startTransition(async () => {
      setNotice(await rebuildBookPdfAction(book.id));
      router.refresh();
    });
  }

  function destroy() {
    const ok = window.confirm(
      `Delete "${book.title}" for good? Its cover and printable book are removed from R2 too. The coloring pages inside it are left alone. This cannot be undone.`,
    );
    if (!ok) return;
    startTransition(() => deleteBookAction(book.id));
  }

  const feedback = notice ?? (state.message ? state : null);

  return (
    <div className="space-y-5">
      {justCreated && (
        <Alert tone="success">
          Book created. Add its pages below, then switch Published on.
        </Alert>
      )}
      {feedback && <Alert tone={feedback.ok ? 'success' : 'error'}>{feedback.message}</Alert>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* ------------------------- main form ------------------------- */}
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="id" value={book.id} />

          <Card title="Content">
            <div className="grid gap-4">
              <Field label="Title" htmlFor="title" required>
                <Input id="title" name="title" defaultValue={book.title} required maxLength={160} />
              </Field>

              <Field label="URL slug" htmlFor="slug" hint={`/book/${slug}`}>
                <Input
                  id="slug"
                  name="slug"
                  value={slug}
                  onChange={(event) => setSlug(slugify(event.target.value))}
                  maxLength={120}
                />
              </Field>

              <Field
                label="Subtitle"
                htmlFor="subtitle"
                hint="Printed under the title on the book's cover page."
              >
                <Input
                  id="subtitle"
                  name="subtitle"
                  defaultValue={book.subtitle ?? ''}
                  maxLength={200}
                />
              </Field>

              <Field
                label="Short description"
                htmlFor="description"
                hint="One or two lines for cards and the fallback meta description."
              >
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={book.description ?? ''}
                  rows={3}
                  maxLength={2000}
                />
              </Field>

              <Field
                label="Full description"
                hint="The long write-up on the book's page. Headings, lists, links and images all work."
              >
                <RichTextEditor name="bodyHtml" defaultValue={book.body_html} />
              </Field>
            </div>
          </Card>

          <Card
            title="Pages in this book"
            description={`Up to ${maxPages} pages, printed in the order below.`}
          >
            <BookPagePicker
              name="pageIds"
              initial={contents}
              categories={categories}
              max={maxPages}
            />
          </Card>

          <Card title="Publishing">
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle
                checked={published}
                onChange={setPublished}
                label="Published"
                hint="Visible on the site and in the sitemap"
              />
              <Toggle
                checked={featured}
                onChange={setFeatured}
                label="Top pick"
                hint="Sorted first on the books page"
              />
              <Toggle
                checked={allowDownload}
                onChange={setAllowDownload}
                label="Allow the PDF download"
                hint="Off leaves the page browsable only"
              />
              <Toggle
                checked={coverPage}
                onChange={setCoverPage}
                label="Add a cover page"
                hint="Title, subtitle and cover art as page one"
              />
            </div>

            {/* Toggle state travels as hidden inputs so the action sees booleans. */}
            <input type="hidden" name="isPublished" value={String(published)} />
            <input type="hidden" name="isFeatured" value={String(featured)} />
            <input type="hidden" name="allowDownload" value={String(allowDownload)} />
            <input type="hidden" name="includeCoverPage" value={String(coverPage)} />
          </Card>

          <Card title="SEO" description="Blank fields fall back to generated text.">
            <div className="grid gap-4">
              <Field label="Meta title" htmlFor="seoTitle">
                <Input
                  id="seoTitle"
                  name="seoTitle"
                  defaultValue={book.seo_title ?? ''}
                  maxLength={200}
                  placeholder={`${book.title} - Free Printable Coloring Book PDF`}
                />
              </Field>
              <Field label="Meta description" htmlFor="seoDescription">
                <Textarea
                  id="seoDescription"
                  name="seoDescription"
                  defaultValue={book.seo_description ?? ''}
                  rows={3}
                  maxLength={400}
                />
              </Field>
            </div>
          </Card>

          <div className="flex flex-wrap justify-between gap-2">
            {canDelete ? (
              <AdminButton type="button" variant="danger" onClick={destroy} loading={pending}>
                <Trash2 className="size-4" aria-hidden />
                Delete book
              </AdminButton>
            ) : (
              <span />
            )}

            <AdminButton type="submit" loading={saving}>
              {!saving && <Save className="size-4" aria-hidden />}
              Save changes
            </AdminButton>
          </div>
        </form>

        {/* ------------------------- sidebar ------------------------- */}
        <aside className="space-y-5">
          <Card title="Cover image" description="Shown on the books page and the PDF cover.">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt={`${book.title} cover`}
                className="mx-auto w-full max-w-60 rounded-xl border border-slate-200 bg-white object-contain p-2"
              />
            ) : (
              <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                No cover yet. The first page of the book stands in for it.
              </p>
            )}

            <AdminButton
              variant="secondary"
              className="mt-3 w-full"
              onClick={() => coverInput.current?.click()}
              loading={uploading}
            >
              <ImageIcon className="size-4" aria-hidden />
              {coverUrl ? 'Replace cover' : 'Upload cover'}
            </AdminButton>

            <input
              ref={coverInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void sendCover(file);
                event.target.value = '';
              }}
            />
          </Card>

          <Card title="Printable book">
            {pdfUrl ? (
              <>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
                >
                  <FileDown className="size-4" aria-hidden />
                  Open the current PDF
                </a>
                <p className="mt-2 text-xs text-slate-500">
                  {book.pdf_pages} page{book.pdf_pages === 1 ? '' : 's'} · built{' '}
                  {formatDateTime(book.pdf_built_at)}
                </p>
              </>
            ) : (
              <Alert tone="warning">
                Not built yet. Rebuild it here, or it is made the first time somebody downloads it.
              </Alert>
            )}

            <AdminButton
              variant="secondary"
              className="mt-3 w-full"
              onClick={rebuild}
              loading={pending}
            >
              <RefreshCw className="size-4" aria-hidden />
              Rebuild from the pages
            </AdminButton>
          </Card>

          <Card title="At a glance">
            <dl className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                  Pages
                </dt>
                <dd className="mt-0.5 text-lg font-extrabold text-slate-900">{contents.length}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                  Downloads
                </dt>
                <dd className="mt-0.5 text-lg font-extrabold text-slate-900">
                  {formatNumber(book.download_count)}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/book/${book.slug}`} target="_blank" rel="noopener noreferrer">
                <AdminButton variant="secondary">
                  <ExternalLink className="size-4" aria-hidden />
                  View book
                </AdminButton>
              </Link>
            </div>

            <p className="mt-3 text-xs text-slate-400">Added {formatDateTime(book.created_at)}</p>
          </Card>

          <Card title="Storage keys">
            <ul className="space-y-2 text-[11px] break-all text-slate-500">
              {(
                [
                  ['Cover', book.cover_key],
                  ['PDF', book.pdf_key],
                ] as const
              ).map(([label, key]) => (
                <li key={label}>
                  <Badge tone="slate">{label}</Badge>{' '}
                  <code className="font-mono">{key ?? '—'}</code>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
