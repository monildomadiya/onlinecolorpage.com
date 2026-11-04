'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, FileText, Trash2 } from 'lucide-react';
import { deleteMediaAction } from '@/app/admin/actions/settings';
import type { ActionResult } from '@/app/admin/actions/pages';
import { AdminButton, Alert, Badge } from './ui';
import { formatBytes, formatDate } from '@/lib/utils';
import type { MediaItem } from '@/types/db';

export function MediaGrid({
  items,
  urlFor,
  canDelete,
}: {
  items: MediaItem[];
  urlFor: Record<string, string>;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [notice, setNotice] = useState<ActionResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function copy(url: string, id: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      setNotice({ ok: false, message: 'Could not copy - your browser blocked clipboard access.' });
    }
  }

  function destroy(item: MediaItem) {
    if (!window.confirm(`Delete ${item.key} from R2? This cannot be undone.`)) return;

    startTransition(async () => {
      setNotice(await deleteMediaAction(item.id));
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
        <p className="text-sm text-slate-500">
          No files yet. Everything you upload shows up here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notice && <Alert tone={notice.ok ? 'success' : 'error'}>{notice.message}</Alert>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item) => {
          const url = urlFor[item.id] ?? '';
          const isPdf = item.kind === 'pdf';

          return (
            <figure
              key={item.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <div className="grid aspect-square place-items-center bg-slate-50 p-2">
                {isPdf ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grid place-items-center text-slate-400 hover:text-violet-600"
                  >
                    <FileText className="size-12" aria-hidden />
                    <span className="mt-1 text-xs font-bold">Open PDF</span>
                  </a>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt={item.original_name ?? item.key} className="size-full object-contain" />
                )}
              </div>

              <figcaption className="space-y-1.5 p-3">
                <p className="truncate text-xs font-bold text-slate-700" title={item.key}>
                  {item.original_name ?? item.key.split('/').pop()}
                </p>
                <div className="flex flex-wrap items-center gap-1">
                  <Badge tone={isPdf ? 'rose' : item.kind === 'thumb' ? 'sky' : 'violet'}>
                    {item.kind}
                  </Badge>
                  <span className="text-[11px] text-slate-400">{formatBytes(item.size_bytes)}</span>
                </div>
                <p className="text-[11px] text-slate-400">{formatDate(item.created_at)}</p>

                <div className="flex gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => void copy(url, item.id)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-slate-100 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-200"
                  >
                    {copied === item.id ? (
                      <>
                        <Check className="size-3.5" aria-hidden /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" aria-hidden /> URL
                      </>
                    )}
                  </button>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => destroy(item)}
                      disabled={pending}
                      aria-label={`Delete ${item.key}`}
                      className="grid place-items-center rounded-lg bg-rose-50 px-2.5 py-1.5 text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  )}
                </div>
              </figcaption>
            </figure>
          );
        })}
      </div>

      <p className="text-xs text-slate-400">
        Files still referenced by a coloring page cannot be deleted here - edit or delete that page
        instead.
      </p>
      <AdminButton variant="ghost" onClick={() => router.refresh()} loading={pending}>
        Refresh
      </AdminButton>
    </div>
  );
}
