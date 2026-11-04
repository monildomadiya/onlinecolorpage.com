'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  CloudUpload,
  FileWarning,
  Loader2,
  RotateCcw,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { AdminButton, Alert, Card, Field, Input, Select, Toggle } from './ui';
import { cn, formatBytes, pMap, titleFromFilename } from '@/lib/utils';
import type { Category, Difficulty } from '@/types/db';

type ItemStatus = 'queued' | 'uploading' | 'done' | 'error';

interface QueueItem {
  id: string;
  file: File;
  title: string;
  status: ItemStatus;
  message?: string;
  slug?: string;
  preview: string;
}

const ACCEPT = 'image/png,image/jpeg,image/webp,image/avif,image/gif,image/svg+xml';
const MAX_BYTES = 20 * 1024 * 1024;
const CONCURRENCY = 3;

/**
 * Bulk uploader.
 *
 * Files go to /api/admin/upload one at a time (three in flight), which is what
 * does the sharp + pdf-lib work and writes the row. Shared fields below apply
 * to the whole batch; each title stays editable because the filename is only a
 * first guess.
 */
export function Uploader({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<QueueItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [running, setRunning] = useState(false);

  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [ageMin, setAgeMin] = useState(3);
  const [ageMax, setAgeMax] = useState(12);
  const [tags, setTags] = useState('');
  const [publish, setPublish] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [generatePdf, setGeneratePdf] = useState(true);

  const counts = useMemo(
    () => ({
      queued: items.filter((i) => i.status === 'queued').length,
      done: items.filter((i) => i.status === 'done').length,
      failed: items.filter((i) => i.status === 'error').length,
    }),
    [items],
  );

  const addFiles = useCallback((files: FileList | File[]) => {
    const accepted = ACCEPT.split(',');

    const next: QueueItem[] = [];
    for (const file of Array.from(files)) {
      if (!accepted.includes(file.type)) continue;
      next.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        title: titleFromFilename(file.name),
        status: file.size > MAX_BYTES ? 'error' : 'queued',
        message: file.size > MAX_BYTES ? `Too large (${formatBytes(file.size)}, max 20 MB)` : undefined,
        preview: URL.createObjectURL(file),
      });
    }

    if (next.length > 0) setItems((prev) => [...prev, ...next]);
  }, []);

  function removeItem(id: string) {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((i) => i.id !== id);
    });
  }

  function clearAll() {
    items.forEach((item) => URL.revokeObjectURL(item.preview));
    setItems([]);
  }

  const uploadOne = useCallback(
    async (item: QueueItem) => {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading', message: undefined } : i)),
      );

      const form = new FormData();
      form.set('mode', 'page');
      form.set('file', item.file);
      form.set('title', item.title);
      if (categoryId) form.set('categoryId', categoryId);
      form.set('difficulty', difficulty);
      form.set('ageMin', String(ageMin));
      form.set('ageMax', String(ageMax));
      form.set('tags', tags);
      form.set('publish', String(publish));
      form.set('featured', String(featured));
      form.set('generatePdf', String(generatePdf));

      try {
        const response = await fetch('/api/admin/upload', { method: 'POST', body: form });
        const payload = (await response.json()) as {
          ok?: boolean;
          error?: string;
          page?: { slug: string };
        };

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error ?? `Upload failed (${response.status})`);
        }

        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'done', slug: payload.page?.slug } : i,
          ),
        );
      } catch (error) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: 'error',
                  message: error instanceof Error ? error.message : 'Upload failed.',
                }
              : i,
          ),
        );
      }
    },
    [ageMax, ageMin, categoryId, difficulty, featured, generatePdf, publish, tags],
  );

  async function startUpload() {
    const pending = items.filter((i) => i.status === 'queued' || i.status === 'error');
    if (pending.length === 0) return;

    setRunning(true);
    try {
      await pMap(pending, CONCURRENCY, (item) => uploadOne(item));
      router.refresh();
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* ------------------------- dropzone ------------------------- */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          'rounded-2xl border-2 border-dashed p-10 text-center transition',
          dragging ? 'border-violet-500 bg-violet-50' : 'border-slate-300 bg-white',
        )}
      >
        <CloudUpload
          className={cn('mx-auto size-11', dragging ? 'text-violet-600' : 'text-slate-400')}
          aria-hidden
        />
        <p className="mt-3 text-base font-extrabold text-slate-800">
          Drop coloring page images here
        </p>
        <p className="mt-1 text-sm text-slate-500">
          PNG, JPG, WebP or SVG · up to 20 MB each · as many as you like
        </p>

        <AdminButton
          type="button"
          variant="secondary"
          className="mt-4"
          onClick={() => inputRef.current?.click()}
        >
          Choose files
        </AdminButton>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {/* ------------------------- batch settings ------------------------- */}
      <Card title="Applies to every file in this batch">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Category" htmlFor="batch-category">
            <Select
              id="batch-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Uncategorised</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.emoji} {category.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Difficulty" htmlFor="batch-difficulty">
            <Select
              id="batch-difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            >
              <option value="easy">Easy - big simple shapes</option>
              <option value="medium">Medium</option>
              <option value="hard">Tricky - lots of detail</option>
            </Select>
          </Field>

          <Field label="Tags" htmlFor="batch-tags" hint="Comma separated, e.g. cat, kitten, pet">
            <Input
              id="batch-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="cat, kitten, pet"
            />
          </Field>

          <Field label="Youngest age" htmlFor="batch-age-min">
            <Input
              id="batch-age-min"
              type="number"
              min={1}
              max={18}
              value={ageMin}
              onChange={(e) => setAgeMin(Number(e.target.value))}
            />
          </Field>

          <Field label="Oldest age" htmlFor="batch-age-max">
            <Input
              id="batch-age-max"
              type="number"
              min={1}
              max={18}
              value={ageMax}
              onChange={(e) => setAgeMax(Number(e.target.value))}
            />
          </Field>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Toggle
            checked={publish}
            onChange={setPublish}
            label="Publish immediately"
            hint="Off keeps them as drafts"
          />
          <Toggle
            checked={generatePdf}
            onChange={setGeneratePdf}
            label="Make printable PDF"
            hint="A4 with safe margins"
          />
          <Toggle
            checked={featured}
            onChange={setFeatured}
            label="Mark as top picks"
            hint="Shows on the home page"
          />
        </div>
      </Card>

      {/* ------------------------- queue ------------------------- */}
      {items.length > 0 && (
        <Card
          title={`${items.length} file${items.length === 1 ? '' : 's'} ready`}
          description={
            counts.done > 0 || counts.failed > 0
              ? `${counts.done} uploaded · ${counts.failed} failed · ${counts.queued} waiting`
              : 'Check the titles, then start the upload.'
          }
          action={
            <div className="flex gap-2">
              <AdminButton variant="ghost" onClick={clearAll} disabled={running}>
                <Trash2 className="size-4" aria-hidden />
                Clear
              </AdminButton>
              <AdminButton
                onClick={startUpload}
                loading={running}
                disabled={counts.queued + counts.failed === 0}
              >
                {!running && <UploadCloud className="size-4" aria-hidden />}
                {counts.failed > 0 && counts.queued === 0 ? 'Retry failed' : 'Upload all'}
              </AdminButton>
            </div>
          }
        >
          {counts.done > 0 && (
            <Alert tone="success">
              {counts.done} page{counts.done === 1 ? '' : 's'} uploaded.{' '}
              <Link href="/admin/pages" className="underline">
                Manage them
              </Link>
              .
            </Alert>
          )}

          <ul className="mt-4 divide-y divide-slate-100">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.preview}
                  alt=""
                  className="size-12 shrink-0 rounded-lg border border-slate-200 bg-white object-contain p-0.5"
                />

                <div className="min-w-0 flex-1">
                  <Input
                    value={item.title}
                    disabled={item.status !== 'queued' && item.status !== 'error'}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((i) => (i.id === item.id ? { ...i, title: e.target.value } : i)),
                      )
                    }
                    className="!py-1.5 text-sm font-bold"
                    aria-label={`Title for ${item.file.name}`}
                  />
                  <p className="mt-1 truncate text-xs text-slate-400">
                    {item.file.name} · {formatBytes(item.file.size)}
                    {item.message && (
                      <span className="font-bold text-rose-600"> · {item.message}</span>
                    )}
                    {item.status === 'done' && item.slug && (
                      <>
                        {' · '}
                        <Link
                          href={`/color/${item.slug}`}
                          target="_blank"
                          className="font-bold text-violet-600 hover:underline"
                        >
                          view page
                        </Link>
                      </>
                    )}
                  </p>
                </div>

                <span className="w-7 shrink-0 text-center">
                  {item.status === 'uploading' && (
                    <Loader2 className="size-5 animate-spin text-violet-600" aria-label="Uploading" />
                  )}
                  {item.status === 'done' && (
                    <CheckCircle2 className="size-5 text-emerald-600" aria-label="Uploaded" />
                  )}
                  {item.status === 'error' && (
                    <FileWarning className="size-5 text-rose-600" aria-label="Failed" />
                  )}
                  {item.status === 'queued' && (
                    <span className="text-xs font-bold text-slate-300">—</span>
                  )}
                </span>

                {item.status === 'error' && (
                  <button
                    type="button"
                    onClick={() => void uploadOne(item)}
                    aria-label="Retry"
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                  >
                    <RotateCcw className="size-4" aria-hidden />
                  </button>
                )}

                {item.status !== 'uploading' && item.status !== 'done' && (
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.file.name}`}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
