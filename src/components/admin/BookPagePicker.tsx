'use client';

import { useState, useTransition } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronsUp,
  FolderPlus,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { categoryPagesAction, searchPagesAction } from '@/app/admin/actions/books';
import { AdminButton, Alert, Badge } from './ui';
import { cn } from '@/lib/utils';
import type { PickerPage } from '@/lib/admin/queries';
import type { Category } from '@/types/db';

/**
 * Builds a book's contents: search the library, add pages, then put them in
 * the order they should be printed.
 *
 * The result leaves as one comma-separated list of ids in a hidden input, so
 * the surrounding form posts it with everything else and the action writes the
 * join table in a single pass.
 */
export function BookPagePicker({
  name,
  initial,
  categories,
  max,
}: {
  name: string;
  initial: PickerPage[];
  categories: Category[];
  max: number;
}) {
  const [chosen, setChosen] = useState<PickerPage[]>(initial);
  const [results, setResults] = useState<PickerPage[] | null>(null);
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const full = chosen.length >= max;
  const picked = new Set(chosen.map((page) => page.id));

  function add(pages: PickerPage[]) {
    setChosen((prev) => {
      const seen = new Set(prev.map((page) => page.id));
      const next = [...prev];
      let skipped = 0;

      for (const page of pages) {
        if (seen.has(page.id)) continue;
        if (next.length >= max) {
          skipped += 1;
          continue;
        }
        next.push(page);
        seen.add(page.id);
      }

      setNotice(
        skipped > 0
          ? `A book holds ${max} pages at most, so ${skipped} did not fit.`
          : null,
      );
      return next;
    });
  }

  function move(index: number, to: number) {
    setChosen((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [page] = next.splice(index, 1);
      next.splice(to, 0, page);
      return next;
    });
  }

  function search() {
    startTransition(async () => {
      setResults(await searchPagesAction(query, categoryId || undefined));
    });
  }

  function addCategory() {
    if (!categoryId) return;
    startTransition(async () => {
      add(await categoryPagesAction(categoryId));
    });
  }

  return (
    <div className="space-y-4">
      {notice && <Alert tone="warning">{notice}</Alert>}

      {/* ----------------------- find pages ----------------------- */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-52 flex-1">
            <label htmlFor="bookSearch" className="sr-only">
              Search the library
            </label>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              id="bookSearch"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  // The book editor is a form; Enter here must not save it.
                  event.preventDefault();
                  search();
                }
              }}
              placeholder="Search by title or slug…"
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-3 pl-9 text-sm focus:border-violet-500 focus:outline-none"
            />
          </div>

          <label htmlFor="bookCategory" className="sr-only">
            Category
          </label>
          <select
            id="bookCategory"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none"
          >
            <option value="">Any category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.emoji} {category.name}
              </option>
            ))}
          </select>

          <AdminButton type="button" variant="secondary" onClick={search} loading={pending}>
            Find pages
          </AdminButton>
          <AdminButton
            type="button"
            variant="ghost"
            onClick={addCategory}
            disabled={!categoryId || full}
            loading={pending}
          >
            <FolderPlus className="size-4" aria-hidden />
            Add whole category
          </AdminButton>
        </div>

        {results && (
          <div className="mt-3">
            {results.length === 0 ? (
              <p className="px-1 py-3 text-sm text-slate-500">
                Nothing in the library matches that.
              </p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {results.map((page) => {
                  const already = picked.has(page.id);
                  return (
                    <li
                      key={page.id}
                      className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={page.thumbUrl}
                        alt=""
                        className="size-10 shrink-0 rounded-lg border border-slate-200 bg-white object-contain p-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-800">{page.title}</p>
                        <p className="truncate text-[11px] text-slate-400">
                          {page.categoryName ?? 'Uncategorised'}
                          {!page.isPublished && ' · draft'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => add([page])}
                        disabled={already || full}
                        title={already ? 'Already in this book' : 'Add to this book'}
                        className={cn(
                          'grid size-8 shrink-0 place-items-center rounded-lg transition',
                          already
                            ? 'cursor-default text-emerald-500'
                            : 'text-slate-400 hover:bg-violet-50 hover:text-violet-600',
                          full && !already && 'cursor-not-allowed opacity-40',
                        )}
                      >
                        {already ? '✓' : <Plus className="size-4" aria-hidden />}
                        <span className="sr-only">Add {page.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* ----------------------- the book itself ----------------------- */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-700">
            {chosen.length} page{chosen.length === 1 ? '' : 's'} in this book
          </p>
          {chosen.length > 0 && (
            <button
              type="button"
              onClick={() => setChosen([])}
              className="text-xs font-bold text-slate-400 hover:text-rose-600"
            >
              Remove all
            </button>
          )}
        </div>

        {chosen.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
            No pages yet. Search above and add the ones this book should contain -
            the order here is the order they print in.
          </p>
        ) : (
          <ol className="space-y-2">
            {chosen.map((page, index) => (
              <li
                key={page.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-extrabold text-slate-500">
                  {index + 1}
                </span>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={page.thumbUrl}
                  alt=""
                  className="size-11 shrink-0 rounded-lg border border-slate-200 bg-white object-contain p-0.5"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">{page.title}</p>
                  <p className="truncate font-mono text-[11px] text-slate-400">/{page.slug}</p>
                </div>

                {!page.isPublished && <Badge tone="amber">draft</Badge>}

                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => move(index, 0)}
                    disabled={index === 0}
                    title="Move to the front"
                    className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                  >
                    <ChevronsUp className="size-4" aria-hidden />
                    <span className="sr-only">Move {page.title} to the front</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, index - 1)}
                    disabled={index === 0}
                    title="Move up"
                    className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                  >
                    <ArrowUp className="size-4" aria-hidden />
                    <span className="sr-only">Move {page.title} up</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, index + 1)}
                    disabled={index === chosen.length - 1}
                    title="Move down"
                    className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                  >
                    <ArrowDown className="size-4" aria-hidden />
                    <span className="sr-only">Move {page.title} down</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChosen((prev) => prev.filter((p) => p.id !== page.id))}
                    title="Remove from this book"
                    className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="size-4" aria-hidden />
                    <span className="sr-only">Remove {page.title}</span>
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <input type="hidden" name={name} value={chosen.map((page) => page.id).join(',')} />
    </div>
  );
}
