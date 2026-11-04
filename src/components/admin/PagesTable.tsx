'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  CheckCircle2,
  Download,
  Eye,
  ExternalLink,
  Palette,
  Pencil,
  Star,
  Trash2,
  XCircle,
} from 'lucide-react';
import { bulkPagesAction, type BulkAction } from '@/app/admin/actions/pages';
import { AdminButton, Alert, Badge, EmptyRow } from './ui';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import type { ColoringPageWithCategory } from '@/types/db';

const DIFFICULTY_TONE = { easy: 'green', medium: 'amber', hard: 'rose' } as const;

export function PagesTable({
  pages,
  thumbFor,
  canDelete,
}: {
  pages: ColoringPageWithCategory[];
  /** Resolved on the server so this component never touches R2 config. */
  thumbFor: Record<string, string>;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const allSelected = pages.length > 0 && selected.size === pages.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(pages.map((p) => p.id)));
  }

  function run(action: BulkAction) {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    if (action === 'delete') {
      const ok = window.confirm(
        `Delete ${ids.length} page${ids.length === 1 ? '' : 's'} for good? The images and PDFs are removed from R2 too. This cannot be undone.`,
      );
      if (!ok) return;
    }

    startTransition(async () => {
      const result = await bulkPagesAction(ids, action);
      setFeedback(result);
      if (result.ok) {
        setSelected(new Set());
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      {feedback && (
        <Alert tone={feedback.ok ? 'success' : 'error'}>{feedback.message}</Alert>
      )}

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
          <span className="text-sm font-extrabold text-violet-900">
            {selected.size} selected
          </span>

          <div className="ml-auto flex flex-wrap gap-2">
            <AdminButton variant="secondary" onClick={() => run('publish')} loading={pending}>
              <CheckCircle2 className="size-4" aria-hidden />
              Publish
            </AdminButton>
            <AdminButton variant="secondary" onClick={() => run('unpublish')} loading={pending}>
              <XCircle className="size-4" aria-hidden />
              Unpublish
            </AdminButton>
            <AdminButton variant="secondary" onClick={() => run('feature')} loading={pending}>
              <Star className="size-4" aria-hidden />
              Feature
            </AdminButton>
            <AdminButton variant="secondary" onClick={() => run('unfeature')} loading={pending}>
              Unfeature
            </AdminButton>
            {canDelete && (
              <AdminButton variant="danger" onClick={() => run('delete')} loading={pending}>
                <Trash2 className="size-4" aria-hidden />
                Delete
              </AdminButton>
            )}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-extrabold tracking-wide text-slate-500 uppercase">
              <tr>
                <th scope="col" className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all pages"
                    className="size-4 rounded border-slate-300 accent-violet-600"
                  />
                </th>
                <th scope="col" className="px-3 py-3">
                  Page
                </th>
                <th scope="col" className="px-3 py-3">
                  Category
                </th>
                <th scope="col" className="px-3 py-3">
                  Status
                </th>
                <th scope="col" className="px-3 py-3">
                  Stats
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
              {pages.length === 0 ? (
                <EmptyRow colSpan={7} message="No coloring pages match these filters." />
              ) : (
                pages.map((page) => (
                  <tr
                    key={page.id}
                    className={cn('transition', selected.has(page.id) ? 'bg-violet-50/60' : 'hover:bg-slate-50')}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(page.id)}
                        onChange={() => toggle(page.id)}
                        aria-label={`Select ${page.title}`}
                        className="size-4 rounded border-slate-300 accent-violet-600"
                      />
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumbFor[page.id] ?? ''}
                          alt=""
                          className="size-11 shrink-0 rounded-lg border border-slate-200 bg-white object-contain p-0.5"
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/admin/pages/${page.id}`}
                            className="block max-w-60 truncate font-bold text-slate-800 hover:text-violet-600"
                          >
                            {page.title}
                          </Link>
                          <p className="max-w-60 truncate font-mono text-[11px] text-slate-400">
                            /{page.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      {page.category ? (
                        <span className="text-xs font-bold text-slate-600">
                          {page.category.emoji} {page.category.name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Badge tone={page.is_published ? 'green' : 'amber'}>
                          {page.is_published ? 'Live' : 'Draft'}
                        </Badge>
                        {page.is_featured && <Badge tone="violet">★</Badge>}
                        <Badge tone={DIFFICULTY_TONE[page.difficulty]}>{page.difficulty}</Badge>
                        {!page.pdf_key && <Badge tone="slate">no pdf</Badge>}
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex gap-3 text-xs font-bold text-slate-500">
                        <span title="Views" className="inline-flex items-center gap-1">
                          <Eye className="size-3.5" aria-hidden />
                          {formatNumber(page.view_count)}
                        </span>
                        <span title="Colourings" className="inline-flex items-center gap-1">
                          <Palette className="size-3.5" aria-hidden />
                          {formatNumber(page.color_count)}
                        </span>
                        <span title="Downloads" className="inline-flex items-center gap-1">
                          <Download className="size-3.5" aria-hidden />
                          {formatNumber(page.download_count)}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-3 text-xs whitespace-nowrap text-slate-500">
                      {formatDate(page.created_at)}
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/color/${page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open on the site"
                          className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <ExternalLink className="size-4" aria-hidden />
                          <span className="sr-only">View {page.title}</span>
                        </Link>
                        <Link
                          href={`/admin/pages/${page.id}`}
                          title="Edit"
                          className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-violet-50 hover:text-violet-600"
                        >
                          <Pencil className="size-4" aria-hidden />
                          <span className="sr-only">Edit {page.title}</span>
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
    </div>
  );
}
