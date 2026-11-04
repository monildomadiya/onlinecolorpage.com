'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, UploadCloud } from 'lucide-react';
import { AdminButton, Alert, Card, Field, Input, Select, Textarea, Toggle } from './ui';
import { formatBytes, slugify, titleFromFilename } from '@/lib/utils';
import type { Category, Difficulty } from '@/types/db';

const ACCEPT = 'image/png,image/jpeg,image/webp,image/avif,image/gif,image/svg+xml';

/** Single-page upload with the full field set, including SEO overrides. */
export function NewPageForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);

  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [ageMin, setAgeMin] = useState(3);
  const [ageMax, setAgeMax] = useState(12);
  const [tags, setTags] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  const [publish, setPublish] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [generatePdf, setGeneratePdf] = useState(true);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickFile(next: File | null) {
    if (preview) URL.revokeObjectURL(preview);

    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : null);

    if (next && !title) {
      const guess = titleFromFilename(next.name);
      setTitle(guess);
      if (!slugTouched) setSlug(slugify(guess));
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!file) {
      setError('Choose a line-art image first.');
      return;
    }
    if (title.trim().length < 2) {
      setError('Give the page a title.');
      return;
    }

    const form = new FormData();
    form.set('mode', 'page');
    form.set('file', file);
    form.set('title', title.trim());
    if (slug.trim()) form.set('slug', slug.trim());
    form.set('description', description.trim());
    if (categoryId) form.set('categoryId', categoryId);
    form.set('difficulty', difficulty);
    form.set('ageMin', String(ageMin));
    form.set('ageMax', String(ageMax));
    form.set('tags', tags);
    form.set('seoTitle', seoTitle.trim());
    form.set('seoDescription', seoDescription.trim());
    form.set('publish', String(publish));
    form.set('featured', String(featured));
    form.set('generatePdf', String(generatePdf));

    setBusy(true);
    try {
      const response = await fetch('/api/admin/upload', { method: 'POST', body: form });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        page?: { id: string };
      };

      if (!response.ok || !payload.ok || !payload.page) {
        throw new Error(payload.error ?? `Upload failed (${response.status})`);
      }

      router.push(`/admin/pages/${payload.page.id}?created=1`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload failed.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && <Alert tone="error">{error}</Alert>}

      <Card title="Line art">
        <div className="grid gap-5 sm:grid-cols-[14rem_minmax(0,1fr)]">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="grid aspect-[4/5] place-items-center rounded-xl border-2 border-dashed border-slate-300 bg-white transition hover:border-violet-400 hover:bg-violet-50"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Selected line art" className="size-full object-contain p-2" />
            ) : (
              <span className="px-4 text-center">
                <ImagePlus className="mx-auto size-8 text-slate-400" aria-hidden />
                <span className="mt-2 block text-sm font-bold text-slate-600">
                  Choose an image
                </span>
                <span className="mt-0.5 block text-xs text-slate-400">PNG, JPG, WebP or SVG</span>
              </span>
            )}
          </button>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />

          <div className="space-y-4">
            <Field label="Title" htmlFor="title" required>
              <Input
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                placeholder="Cute Baby Elephant"
                required
              />
            </Field>

            <Field
              label="URL slug"
              htmlFor="slug"
              hint={slug ? `/color/${slug}` : 'Generated from the title'}
            >
              <Input
                id="slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
                placeholder="cute-baby-elephant"
              />
            </Field>

            <Field
              label="Description"
              htmlFor="description"
              hint="Shown under the canvas and used for search results."
            >
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="A friendly baby elephant with big ears, perfect for little hands."
              />
            </Field>

            {file && (
              <p className="text-xs text-slate-400">
                {file.name} · {formatBytes(file.size)}
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card title="Details">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Category" htmlFor="categoryId">
            <Select
              id="categoryId"
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

          <Field label="Difficulty" htmlFor="difficulty">
            <Select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Tricky</option>
            </Select>
          </Field>

          <Field label="Tags" htmlFor="tags" hint="Comma separated">
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="elephant, animals, jungle"
            />
          </Field>

          <Field label="Youngest age" htmlFor="ageMin">
            <Input
              id="ageMin"
              type="number"
              min={1}
              max={18}
              value={ageMin}
              onChange={(e) => setAgeMin(Number(e.target.value))}
            />
          </Field>

          <Field label="Oldest age" htmlFor="ageMax">
            <Input
              id="ageMax"
              type="number"
              min={1}
              max={18}
              value={ageMax}
              onChange={(e) => setAgeMax(Number(e.target.value))}
            />
          </Field>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Toggle checked={publish} onChange={setPublish} label="Publish immediately" />
          <Toggle checked={generatePdf} onChange={setGeneratePdf} label="Make printable PDF" />
          <Toggle checked={featured} onChange={setFeatured} label="Mark as top pick" />
        </div>
      </Card>

      <Card
        title="SEO overrides"
        description="Leave blank and sensible defaults are generated from the title and description."
      >
        <div className="grid gap-4">
          <Field label="Meta title" htmlFor="seoTitle" hint="Aim for under 60 characters.">
            <Input
              id="seoTitle"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              maxLength={200}
              placeholder="Baby Elephant Coloring Page - Free Printable"
            />
          </Field>
          <Field
            label="Meta description"
            htmlFor="seoDescription"
            hint="Aim for 140-158 characters."
          >
            <Textarea
              id="seoDescription"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              rows={2}
              maxLength={400}
            />
          </Field>
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <AdminButton type="submit" loading={busy}>
          {!busy && <UploadCloud className="size-4" aria-hidden />}
          Upload and save
        </AdminButton>
      </div>
    </form>
  );
}
