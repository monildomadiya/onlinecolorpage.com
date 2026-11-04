'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BADGES, earnedBadges, nextBadge, readRewards, type Rewards } from '@/components/coloring/storage';
import { cn } from '@/lib/utils';

/**
 * Shows the child's stars, streak and badge progress.
 *
 * All of it lives in localStorage on the device - no accounts, nothing sent
 * anywhere. Renders nothing until something has actually been finished, so a
 * first-time visitor is not shown an empty trophy case.
 */
export function RewardStrip({ className }: { className?: string }) {
  const [rewards, setRewards] = useState<Rewards | null>(null);

  useEffect(() => setRewards(readRewards()), []);

  if (!rewards || rewards.finished.length === 0) return null;

  const earned = earnedBadges(rewards);
  const next = nextBadge(rewards);
  const progress = next
    ? Math.round((rewards.finished.length / next.need) * 100)
    : 100;

  return (
    <section
      aria-label="Your rewards"
      className={cn(
        'mt-8 overflow-hidden rounded-[2rem] bg-gradient-to-r from-sunny/25 via-coral/15 to-grape-100 p-5',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <span aria-hidden className="text-4xl animate-bob">
            🏅
          </span>
          <div>
            <p className="font-display text-lg leading-tight font-extrabold text-ink">
              {rewards.stars} stars
            </p>
            <p className="text-xs font-bold text-ink-soft">
              {rewards.finished.length} page{rewards.finished.length === 1 ? '' : 's'} finished
              {rewards.streakDays > 1 && ` · ${rewards.streakDays}-day streak 🔥`}
            </p>
          </div>
        </div>

        <ul className="flex flex-wrap gap-1.5">
          {BADGES.map((badge) => {
            const has = earned.some((b) => b.id === badge.id);
            return (
              <li
                key={badge.id}
                title={has ? badge.label : `${badge.label} - finish ${badge.need} pages`}
                className={cn(
                  'grid size-10 place-items-center rounded-2xl text-xl transition',
                  has ? 'bg-white shadow-sm' : 'bg-white/40 opacity-40 grayscale',
                )}
              >
                <span aria-hidden>{badge.emoji}</span>
                <span className="sr-only">
                  {badge.label}: {has ? 'unlocked' : 'locked'}
                </span>
              </li>
            );
          })}
        </ul>

        <Link
          href="/my-art"
          className="ml-auto rounded-xl bg-white px-4 py-2.5 font-display text-sm font-extrabold text-grape-700 shadow-[0_4px_0_rgba(43,33,64,0.08)]"
        >
          My sticker book →
        </Link>
      </div>

      {next && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-extrabold text-ink-soft">
            <span>
              Next badge: {next.emoji} {next.label}
            </span>
            <span>
              {rewards.finished.length}/{next.need}
            </span>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/70">
            <div
              className="h-full rounded-full bg-grape-500 transition-[width] duration-700"
              style={{ width: `${Math.max(progress, 4)}%` }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
