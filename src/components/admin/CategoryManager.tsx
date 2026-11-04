'use client';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ImageIcon,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import {
  deleteCategoryAction,
  reorderCategoriesAction,
  saveCategoryAction,
} from '@/app/admin/actions/categories';
import type { ActionResult } from '@/app/admin/actions/pages';
import { AdminButton, Alert, Badge, Field, Input, Textarea, Toggle } from './ui';
import { slugify } from '@/lib/utils';
import type { Category } from '@/types/db';

const INITIAL: ActionResult = { ok: false, message: '' };

type Row = Category & { page_count: number };

const EMOJI_CHOICES = [
  '🎨', '🐾', '⭐', '🚗', '👑', '🦖', '🌸', '🔤', '🎁', '🚀',
  '🍰', '🌳', '🌀', '🐠', '🦄', '🎃', '❄️', '⚽', '🎵', '🏰',
];

export function CategoryManager({
  categories,
  coverFor,
  canDelete,
}: {
  categories: Row[];
  coverFor: Record<string, string>;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Row | 'new' | null>(null);
  const [order, setOrder] = useState<Row[]>(categories);
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;

    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    setDirty(true);
  }

  function saveOrder() {
    startTransition(async () => {
      setNotice(await reorderCategoriesAction(order.map((c) => c.id)));
      setDirty(false);
      router.refresh();
    });
  }

  function destroy(category: Row) {
    const warning = category.page_count
      ? `Delete "${category.name}"? Its ${category.page_count} page(s) stay but become uncategorised.`
      : `Delete "${category.name}"?`;
    if (!window.confirm(warning)) return;

    startTransition(async () => {
      setNotice(await deleteCategoryAction(category.id));
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {notice && <Alert tone={notice.ok ? 'success' : 'error'}>{notice.message}</Alert>}

      <div className="flex flex-wrap items-center gap-2">
        <AdminButton onClick={() => setEditing('new')}>
          <Plus className="size-4" aria-hidden />
          New category
        </AdminButton>

        {dirty && (
          <AdminButton variant="secondary" onClick={saveOrder} loading={pending}>
            <Save className="size-4" aria-hidden />
            Save new order
          </AdminButton>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <ul className="divide-y divide-slate-100">
          {order.length === 0 && (
            <li className="px-5 py-12 text-center text-sm text-slate-500">
              No categories yet. Create your first one above.
            </li>
          )}

          {order.map((category, index) => (
            <li key={category.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${category.name} up`}
                  className="grid size-6 place-items-center rounded text-slate-400 hover:bg-slate-100 disabled:opacity-25"
                >
                  <ChevronUp className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === order.length - 1}
                  aria-label={`Move ${category.name} down`}
                  className="grid size-6 place-items-center rounded text-slate-400 hover:bg-slate-100 disabled:opacity-25"
                >
                  <ChevronDown className="size-4" aria-hidden />
                </button>
              </div>

              <span
                className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl text-2xl"
                style={{ background: `${category.color ?? '#8b5cf6'}1f` }}
              >
                {coverFor[category.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverFor[category.id]} alt="" className="size-full object-cover" />
                ) : (
                  <span aria-hidden>{category.emoji ?? '🎨'}</span>
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-slate-800">{category.name}</p>
                <p className="truncate font-mono text-[11px] text-slate-400">/{category.slug}</p>
              </div>

              <div className="flex items-center gap-2">
                <Badge tone="slate">{category.page_count} pages</Badge>
                <Badge tone={category.is_active ? 'green' : 'amber'}>
                  {category.is_active ? 'Active' : 'Hidden'}
                </Badge>
              </div>

              <div className="flex items-center gap-1">
                <Link
                  href={`/category/${category.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open on the site"
                  className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <ExternalLink className="size-4" aria-hidden />
                  <span className="sr-only">View {category.name}</span>
                </Link>

                <AdminButton variant="ghost" onClick={() => setEditing(category)}>
                  Edit
                </AdminButton>

                {canDelete && (
                  <button
                    type="button"
                    onClick={() => destroy(category)}
                    title="Delete"
                    className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="size-4" aria-hidden />
                    <span className="sr-only">Delete {category.name}</span>
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {editing && (
        <CategoryDialog
          category={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function CategoryDialog({
  category,
  onClose,
  onSaved,
}: {
  category: Row | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [state, formAction, saving] = useActionState(saveCategoryAction, INITIAL);
  const [name, setName] = useState(category?.name ?? '');
  const [slug, setSlug] = useState(category?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(category));
  const [emoji, setEmoji] = useState(category?.emoji ?? '🎨');
  const [color, setColor] = useState(category?.color ?? '#8B5CF6');
  const [active, setActive] = useState(category?.is_active ?? true);

  const [uploading, setUploading] = useState(false);
  const [coverNote, setCoverNote] = useState<string | null>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  // Close the dialog once the action reports success.
  useEffect(() => {
    if (state.ok && !saving) onSaved();
  }, [state.ok, saving, onSaved]);

  async function uploadCover(file: File) {
    if (!category) return;
    setUploading(true);
    setCoverNote(null);

    const form = new FormData();
    form.set('mode', 'cover');
    form.set('categoryId', category.id);
    form.set('file', file);

    try {
      const response = await fetch('/api/admin/upload', { method: 'POST', body: form });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? 'Upload failed.');
      setCoverNote('Cover image saved.');
    } catch (error) {
      setCoverNote(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={category ? `Edit ${category.name}` : 'New category'}
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-lg rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-extrabold text-slate-900">
            {category ? `Edit ${category.name}` : 'New category'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>

        <form action={formAction} className="space-y-4 p-5">
          <input type="hidden" name="id" value={category?.id ?? ''} />
          <input type="hidden" name="isActive" value={String(active)} />
          <input type="hidden" name="emoji" value={emoji} />

          {state.message && !state.ok && <Alert tone="error">{state.message}</Alert>}
          {coverNote && <Alert tone={coverNote.includes('saved') ? 'success' : 'error'}>{coverNote}</Alert>}

          <Field label="Name" htmlFor="cat-name" required>
            <Input
              id="cat-name"
              name="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              required
              maxLength={80}
            />
          </Field>

          <Field label="URL slug" htmlFor="cat-slug" hint={slug ? `/category/${slug}` : undefined}>
            <Input
              id="cat-slug"
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              maxLength={80}
            />
          </Field>

          <Field label="Description" htmlFor="cat-description">
            <Textarea
              id="cat-description"
              name="description"
              defaultValue={category?.description ?? ''}
              rows={3}
              maxLength={600}
            />
          </Field>

          <Field label="Icon" hint="Shown on cards and in the mobile menu.">
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_CHOICES.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => setEmoji(choice)}
                  aria-pressed={emoji === choice}
                  className={
                    emoji === choice
                      ? 'grid size-9 place-items-center rounded-lg bg-violet-100 text-xl ring-2 ring-violet-500'
                      : 'grid size-9 place-items-center rounded-lg bg-slate-50 text-xl hover:bg-slate-100'
                  }
                >
                  <span aria-hidden>{choice}</span>
                </button>
              ))}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Theme colour" htmlFor="cat-color">
              <div className="flex items-center gap-2">
                <input
                  id="cat-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value.toUpperCase())}
                  className="size-10 shrink-0 cursor-pointer rounded-lg border border-slate-300"
                  aria-label="Pick theme colour"
                />
                <Input
                  name="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value.toUpperCase())}
                  maxLength={7}
                />
              </div>
            </Field>

            <Field label="Sort order" htmlFor="cat-sort" hint="Lower numbers come first.">
              <Input
                id="cat-sort"
                name="sortOrder"
                type="number"
                min={0}
                max={9999}
                defaultValue={category?.sort_order ?? 0}
              />
            </Field>
          </div>

          <Toggle
            checked={active}
            onChange={setActive}
            label="Active"
            hint="Hidden categories disappear from the site but keep their pages."
          />

          <details className="rounded-xl bg-slate-50 p-3">
            <summary className="cursor-pointer text-sm font-bold text-slate-700">
              SEO overrides
            </summary>
            <div className="mt-3 space-y-3">
              <Field label="Meta title" htmlFor="cat-seo-title">
                <Input
                  id="cat-seo-title"
                  name="seoTitle"
                  defaultValue={category?.seo_title ?? ''}
                  maxLength={200}
                />
              </Field>
              <Field label="Meta description" htmlFor="cat-seo-description">
                <Textarea
                  id="cat-seo-description"
                  name="seoDescription"
                  defaultValue={category?.seo_description ?? ''}
                  rows={2}
                  maxLength={400}
                />
              </Field>
            </div>
          </details>

          {category && (
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-sm font-bold text-slate-700">Cover image</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Optional. Replaces the emoji on category cards.
              </p>
              <AdminButton
                type="button"
                variant="secondary"
                className="mt-2.5"
                loading={uploading}
                onClick={() => coverInput.current?.click()}
              >
                <ImageIcon className="size-4" aria-hidden />
                Upload cover
              </AdminButton>
              <input
                ref={coverInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadCover(file);
                  e.target.value = '';
                }}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <AdminButton type="button" variant="secondary" onClick={onClose}>
              Cancel
            </AdminButton>
            <AdminButton type="submit" loading={saving}>
              <Save className="size-4" aria-hidden />
              {category ? 'Save changes' : 'Create category'}
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
}
