'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const SORTS = [
  { value: 'newest', label: '🆕 Newest' },
  { value: 'popular', label: '🔥 Most viewed' },
  { value: 'most_colored', label: '🎨 Most coloured' },
  { value: 'az', label: '🔤 A - Z' },
] as const;

const DIFFICULTIES = [
  { value: '', label: 'All' },
  { value: 'easy', label: '😊 Easy' },
  { value: 'medium', label: '🙂 Medium' },
  { value: 'hard', label: '🤓 Tricky' },
] as const;

export function FilterBar({
  basePath,
  tags = [],
  className,
}: {
  basePath: string;
  tags?: { tag: string; count: number }[];
  className?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const sort = params.get('sort') ?? 'newest';
  const difficulty = params.get('difficulty') ?? '';
  const activeTag = params.get('tag') ?? '';

  /** Rewrites one query param and resets paging. */
  const apply = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete('page');

      const query = next.toString();
      router.push(query ? `${basePath}?${query}` : basePath, { scroll: false });
    },
    [basePath, params, router],
  );

  const hasFilters = Boolean(difficulty || activeTag || (sort && sort !== 'newest'));

  return (
    <div className={cn('card-kid p-4', className)}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-grape-600" aria-hidden />
          <span className="font-display text-sm font-extrabold text-ink">Filters</span>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-xs font-extrabold text-ink-soft uppercase">
            Sort
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => apply('sort', e.target.value)}
            className="rounded-xl border-2 border-cream-deep bg-white px-3 py-2 font-display text-sm font-extrabold text-ink focus:border-grape-400 focus:outline-none"
          >
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-extrabold text-ink-soft uppercase">Level</span>
          {DIFFICULTIES.map((option) => (
            <button
              key={option.value || 'all'}
              type="button"
              onClick={() => apply('difficulty', option.value)}
              aria-pressed={difficulty === option.value}
              className={cn(
                'rounded-xl px-3 py-2 font-display text-xs font-extrabold transition',
                difficulty === option.value
                  ? 'bg-grape-500 text-white'
                  : 'bg-cream-deep text-ink-soft hover:bg-grape-100',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={() => router.push(basePath, { scroll: false })}
            className="ml-auto inline-flex items-center gap-1 rounded-xl bg-coral/15 px-3 py-2 font-display text-xs font-extrabold text-coral-dark"
          >
            <X className="size-3.5" aria-hidden /> Clear
          </button>
        )}
      </div>

      {tags.length > 0 && (
        <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto border-t-2 border-cream-deep pt-3">
          {activeTag && (
            <button
              type="button"
              onClick={() => apply('tag', '')}
              className="shrink-0 rounded-full bg-grape-500 px-3 py-1.5 text-xs font-extrabold whitespace-nowrap text-white"
            >
              #{activeTag} ✕
            </button>
          )}
          {tags
            .filter((t) => t.tag !== activeTag)
            .slice(0, 24)
            .map(({ tag, count }) => (
              <button
                key={tag}
                type="button"
                onClick={() => apply('tag', tag)}
                className="shrink-0 rounded-full bg-cream-deep px-3 py-1.5 text-xs font-extrabold whitespace-nowrap text-ink-soft transition hover:bg-grape-100 hover:text-grape-700"
              >
                #{tag} <span className="opacity-50">{count}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
