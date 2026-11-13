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
  Upload,
} from 'lucide-react';
import {
  deletePageAction,
  regeneratePdfAction,
  removeReferenceAction,
  updatePageAction,
  type ActionResult,
} from '@/app/admin/actions/pages';
import { RichTextEditor } from './RichTextEditor';
import { AdminButton, Alert, Badge, Card, Field, Input, Select, Textarea, Toggle } from './ui';
import { formatBytes, formatDateTime, formatNumber, slugify } from '@/lib/utils';
import type { Category, ColoringPage, Difficulty } from '@/types/db';

const INITIAL: ActionResult = { ok: false, message: '' };

export function EditPageForm({
  page,
  categories,
  imageUrl,
  thumbUrl,
  referenceUrl,
  pdfUrl,
  canDelete,
  justCreated,
}: {
  page: ColoringPage;
  categories: Category[];
  imageUrl: string;
  thumbUrl: string;
  referenceUrl: string | null;
  pdfUrl: string | null;
  canDelete: boolean;
  justCreated: boolean;
}) {
  const router = useRouter();
  const [state, formAction, saving] = useActionState(updatePageAction, INITIAL);

  const [slug, setSlug] = useState(page.slug);
  const [published, setPublished] = useState(page.is_published);
  const [featured, setFeatured] = useState(page.is_featured);
  const [allowColor, setAllowColor] = useState(page.allow_online_color);
  const [allowDownload, setAllowDownload] = useState(page.allow_download);

  const [notice, setNotice] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState<null | 'reference' | 'pdf'>(null);

  const refInput = useRef<HTMLInputElement>(null);
  const pdfInput = useRef<HTMLInputElement>(null);

  async function sendFile(mode: 'reference' | 'pdf', file: File) {
    setUploading(mode);
    setNotice(null);

    const form = new FormData();
    form.set('mode', mode);
    form.set('pageId', page.id);
    form.set('file', file);

    try {
      const response = await fetch('/api/admin/upload', { method: 'POST', body: form });
      const payload = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? `Upload failed (${response.status})`);
      }

      setNotice({
        ok: true,
        message: mode === 'pdf' ? 'Printable PDF replaced.' : 'Guide image saved.',
      });
      router.refresh();
    } catch (error) {
      setNotice({
        ok: false,
        message: error instanceof Error ? error.message : 'Upload failed.',
      });
    } finally {
      setUploading(null);
    }
  }

  function regenerate() {
    startTransition(async () => {
      setNotice(await regeneratePdfAction(page.id));
      router.refresh();
    });
  }

  function dropReference() {
    startTransition(async () => {
      setNotice(await removeReferenceAction(page.id));
      router.refresh();
    });
  }

  function destroy() {
    const ok = window.confirm(
      `Delete "${page.title}" for good? Its image, thumbnail and PDF are removed from R2 too. This cannot be undone.`,
    );
    if (!ok) return;
    startTransition(() => deletePageAction(page.id));
  }

  const feedback = notice ?? (state.message ? state : null);

  return (
    <div className="space-y-5">
      {justCreated && <Alert tone="success">Page created. Fine-tune anything below.</Alert>}
      {feedback && <Alert tone={feedback.ok ? 'success' : 'error'}>{feedback.message}</Alert>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* ------------------------- main form ------------------------- */}
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="id" value={page.id} />

          <Card title="Content">
            <div className="grid gap-4">
              <Field label="Title" htmlFor="title" required>
                <Input id="title" name="title" defaultValue={page.title} required maxLength={160} />
              </Field>

              <Field label="URL slug" htmlFor="slug" hint={`/color/${slug}`}>
                <Input
                  id="slug"
                  name="slug"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  maxLength={120}
                />
              </Field>

              <Field
                label="Description"
                htmlFor="description"
                hint="One or two lines. This is what the meta description falls back to."
              >
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={page.description ?? ''}
                  rows={4}
                  maxLength={2000}
                />
              </Field>

              <Field
                label="Full write-up"
                hint="Optional long copy under the canvas - headings, lists, links and images."
              >
                <RichTextEditor name="bodyHtml" defaultValue={page.body_html} />
              </Field>
            </div>
          </Card>

          <Card title="Details">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Category" htmlFor="categoryId">
                <Select
                  id="categoryId"
                  name="categoryId"
                  defaultValue={page.category_id ?? ''}
                >
                  <option value="">Uncategorised</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.emoji} {category.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Difficulty" htmlFor="difficulty">
                <Select
                  id="difficulty"
                  name="difficulty"
                  defaultValue={page.difficulty satisfies Difficulty}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Tricky</option>
                </Select>
              </Field>

              <Field label="Tags" htmlFor="tags" hint="Comma separated">
                <Input id="tags" name="tags" defaultValue={page.tags.join(', ')} maxLength={600} />
              </Field>

              <Field label="Youngest age" htmlFor="ageMin">
                <Input
                  id="ageMin"
                  name="ageMin"
                  type="number"
                  min={1}
                  max={18}
                  defaultValue={page.age_min}
                />
              </Field>

              <Field label="Oldest age" htmlFor="ageMax">
                <Input
                  id="ageMax"
                  name="ageMax"
                  type="number"
                  min={1}
                  max={18}
                  defaultValue={page.age_max}
                />
              </Field>

              <Field
                label="Suggested palette"
                htmlFor="suggestedColors"
                hint="Hex values, comma separated. Auto-filled from a guide image."
              >
                <Input
                  id="suggestedColors"
                  name="suggestedColors"
                  defaultValue={page.suggested_colors.join(', ')}
                  placeholder="#FF6B81, #38BDF8"
                  maxLength={600}
                />
              </Field>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Toggle checked={published} onChange={setPublished} label="Published" hint="Visible on the site" />
              <Toggle checked={featured} onChange={setFeatured} label="Top pick" hint="Featured on the home page" />
              <Toggle
                checked={allowColor}
                onChange={setAllowColor}
                label="Allow online colouring"
                hint="Off makes it print-only"
              />
              <Toggle
                checked={allowDownload}
                onChange={setAllowDownload}
                label="Allow downloads"
                hint="PNG and PDF buttons"
              />
            </div>

            {/* Toggle state travels as hidden inputs so the action sees booleans. */}
            <input type="hidden" name="isPublished" value={String(published)} />
            <input type="hidden" name="isFeatured" value={String(featured)} />
            <input type="hidden" name="allowOnlineColor" value={String(allowColor)} />
            <input type="hidden" name="allowDownload" value={String(allowDownload)} />
          </Card>

          <Card title="SEO" description="Blank fields fall back to generated text.">
            <div className="grid gap-4">
              <Field label="Meta title" htmlFor="seoTitle">
                <Input
                  id="seoTitle"
                  name="seoTitle"
                  defaultValue={page.seo_title ?? ''}
                  maxLength={200}
                  placeholder={`${page.title} Coloring Page - Free Printable & Online`}
                />
              </Field>
              <Field label="Meta description" htmlFor="seoDescription">
                <Textarea
                  id="seoDescription"
                  name="seoDescription"
                  defaultValue={page.seo_description ?? ''}
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
                Delete page
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
          <Card title="Line art">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbUrl || imageUrl}
              alt={page.title}
              className="mx-auto w-full max-w-60 rounded-xl border border-slate-200 bg-white object-contain p-2"
            />

            <dl className="mt-4 space-y-1.5 text-xs text-slate-500">
              <div className="flex justify-between gap-2">
                <dt>Size</dt>
                <dd className="font-bold text-slate-700">
                  {page.width} × {page.height}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>File</dt>
                <dd className="font-bold text-slate-700">{formatBytes(page.file_size)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Added</dt>
                <dd className="font-bold text-slate-700">{formatDateTime(page.created_at)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Updated</dt>
                <dd className="font-bold text-slate-700">{formatDateTime(page.updated_at)}</dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/color/${page.slug}`} target="_blank" rel="noopener noreferrer">
                <AdminButton variant="secondary">
                  <ExternalLink className="size-4" aria-hidden />
                  View page
                </AdminButton>
              </Link>
            </div>
          </Card>

          <Card title="Stats">
            <dl className="grid grid-cols-3 gap-2 text-center">
              {[
                ['Views', page.view_count],
                ['Coloured', page.color_count],
                ['Downloads', page.download_count],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-xl bg-slate-50 p-3">
                  <dt className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                    {label}
                  </dt>
                  <dd className="mt-0.5 text-lg font-extrabold text-slate-900">
                    {formatNumber(value as number)}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card title="Printable PDF">
            {pdfUrl ? (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
              >
                <FileDown className="size-4" aria-hidden />
                Open current PDF
              </a>
            ) : (
              <Alert tone="warning">
                No PDF yet. Rebuild it below, or one is made the first time somebody downloads it.
              </Alert>
            )}

            <div className="mt-3 flex flex-col gap-2">
              <AdminButton variant="secondary" onClick={regenerate} loading={pending}>
                <RefreshCw className="size-4" aria-hidden />
                Rebuild from line art
              </AdminButton>

              <AdminButton
                variant="ghost"
                onClick={() => pdfInput.current?.click()}
                loading={uploading === 'pdf'}
              >
                <Upload className="size-4" aria-hidden />
                Upload my own PDF
              </AdminButton>
              <input
                ref={pdfInput}
                type="file"
                accept="application/pdf"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void sendFile('pdf', file);
                  e.target.value = '';
                }}
              />
            </div>
          </Card>

          <Card
            title="Guide image"
            description="A pre-coloured version kids can peek at. Also sets the suggested palette."
          >
            {referenceUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={referenceUrl}
                  alt="Colour guide"
                  className="mx-auto w-full max-w-48 rounded-xl border border-slate-200 object-contain"
                />
                {page.suggested_colors.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {page.suggested_colors.map((color) => (
                      <span
                        key={color}
                        title={color}
                        className="size-6 rounded-md border border-black/10"
                        style={{ background: color }}
                      />
                    ))}
                  </div>
                )}
                <AdminButton
                  variant="ghost"
                  className="mt-3 w-full"
                  onClick={dropReference}
                  loading={pending}
                >
                  <Trash2 className="size-4" aria-hidden />
                  Remove guide
                </AdminButton>
              </>
            ) : (
              <AdminButton
                variant="secondary"
                className="w-full"
                onClick={() => refInput.current?.click()}
                loading={uploading === 'reference'}
              >
                <ImageIcon className="size-4" aria-hidden />
                Upload guide image
              </AdminButton>
            )}

            <input
              ref={refInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void sendFile('reference', file);
                e.target.value = '';
              }}
            />
          </Card>

          <Card title="Storage keys">
            <ul className="space-y-2 text-[11px] break-all text-slate-500">
              {(
                [
                  ['Master', page.image_key],
                  ['Thumbnail', page.thumb_key],
                  ['PDF', page.pdf_key],
                  ['Guide', page.reference_key],
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
