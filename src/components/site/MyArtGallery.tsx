'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Download, Images, Loader2, Star, Trash2 } from 'lucide-react';
import {
  BADGES,
  deleteArtwork,
  earnedBadges,
  listArtwork,
  nextBadge,
  readRewards,
  type Rewards,
  type SavedArtwork,
} from '@/components/coloring/storage';
import { titleFromFilename } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Entry extends SavedArtwork {
  url: string;
}

/**
 * The child's own gallery, read straight out of IndexedDB on this device.
 * There are no accounts, so nothing here has ever left the browser.
 */
export function MyArtGallery() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [rewards, setRewards] = useState<Rewards | null>(null);

  const load = useCallback(async () => {
    const saved = await listArtwork();
    setEntries(saved.map((item) => ({ ...item, url: URL.createObjectURL(item.blob) })));
    setRewards(readRewards());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Release the object URLs when the list is replaced or the page unmounts.
  useEffect(
    () => () => {
      entries?.forEach((entry) => URL.revokeObjectURL(entry.url));
    },
    [entries],
  );

  async function remove(slug: string) {
    await deleteArtwork(slug);
    await load();
  }

  if (entries === null) {
    return (
      <div className="grid place-items-center py-16">
        <Loader2 className="size-8 animate-spin text-grape-500" aria-hidden />
      </div>
    );
  }

  const earned = rewards ? earnedBadges(rewards) : [];
  const next = rewards ? nextBadge(rewards) : null;

  return (
    <>
      {rewards && (
        <section className="card-kid mb-8 p-5" aria-label="Badges">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="flex items-center gap-1.5 font-display text-2xl font-extrabold text-grape-700">
                <Star className="size-6 fill-sunny text-sunny" aria-hidden />
                {rewards.stars} stars
              </p>
              <p className="text-xs font-bold text-ink-soft">
                {rewards.finished.length} finished
                {rewards.streakDays > 1 && ` · ${rewards.streakDays}-day streak`}
              </p>
            </div>

            <ul className="flex flex-wrap gap-2">
              {BADGES.map((badge) => {
                const has = earned.some((b) => b.id === badge.id);
                return (
                  <li
                    key={badge.id}
                    className={cn(
                      'flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-extrabold',
                      has
                        ? 'border border-sunny/45 bg-sunny/20 text-ink'
                        : 'border border-ink/10 bg-white text-ink-soft/40 grayscale',
                    )}
                  >
                    <badge.icon className="size-4" aria-hidden />
                    <span className="hidden sm:inline">{badge.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {next && (
            <p className="mt-3 text-xs font-bold text-ink-soft">
              Finish {next.need - rewards.finished.length} more page
              {next.need - rewards.finished.length === 1 ? '' : 's'} to unlock {next.label}.
            </p>
          )}
        </section>
      )}

      {entries.length === 0 ? (
        <div className="card-kid mx-auto max-w-lg px-6 py-12 text-center">
          <span
            aria-hidden
            className="mx-auto grid size-16 place-items-center rounded-xl bg-grape-50 text-grape-400"
          >
            <Images className="size-8" />
          </span>
          <h2 className="mt-3 font-display text-xl font-extrabold text-ink">
            Your sticker book is empty
          </h2>
          <p className="mt-2 text-sm font-semibold text-ink-soft">
            Colour a page and it will be saved right here on this device, ready to finish later.
          </p>
          <Link href="/coloring-pages" className="btn-kid mt-5">
            Find something to colour
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {entries.map((entry) => (
            <article key={entry.slug} className="card-kid overflow-hidden">
              <Link href={`/color/${entry.slug}`} className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={entry.url}
                  alt={`Your coloring of ${titleFromFilename(entry.slug)}`}
                  className="aspect-[4/5] w-full bg-white object-contain p-2"
                />
              </Link>

              <div className="p-3">
                <h3 className="font-display text-sm leading-tight font-extrabold text-ink line-clamp-2">
                  {titleFromFilename(entry.slug)}
                </h3>
                <p className="mt-0.5 text-[11px] font-bold text-ink-soft/70">
                  {new Date(entry.savedAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </p>

                <div className="mt-2.5 flex gap-1.5">
                  <a
                    href={entry.url}
                    download={`${entry.slug}-my-coloring.webp`}
                    aria-label="Download"
                    className="grid flex-1 place-items-center rounded-xl bg-mint/20 py-2 text-mint-dark transition hover:bg-mint/30"
                  >
                    <Download className="size-4" aria-hidden />
                  </a>
                  <button
                    type="button"
                    onClick={() => void remove(entry.slug)}
                    aria-label="Delete"
                    className="grid flex-1 place-items-center rounded-xl bg-coral/15 py-2 text-coral-dark transition hover:bg-coral/25"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
