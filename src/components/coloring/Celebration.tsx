'use client';

import { useEffect, useRef } from 'react';
import { Download, PartyPopper, Printer, Share2, Star, X } from 'lucide-react';
import type { Badge } from './storage';
import { cn } from '@/lib/utils';

const CONFETTI_COLORS = [
  '#FFC83D',
  '#FF6B81',
  '#38BDF8',
  '#34D399',
  '#8B4FF5',
  '#FF8A3D',
  '#F472B6',
];

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  spin: number;
  angle: number;
  color: string;
}

/** Full-screen confetti burst. Unmount it to stop and free the canvas. */
export function Confetti({ pieces = 140 }: { pieces?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const items: Piece[] = Array.from({ length: pieces }, () => ({
      x: Math.random() * width,
      y: -20 - Math.random() * height * 0.5,
      vx: (Math.random() - 0.5) * 2.4,
      vy: 2 + Math.random() * 3.4,
      size: 6 + Math.random() * 9,
      spin: (Math.random() - 0.5) * 0.25,
      angle: Math.random() * Math.PI,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    }));

    let raf = 0;
    let frames = 0;

    function tick() {
      frames++;
      ctx!.clearRect(0, 0, width, height);

      for (const piece of items) {
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.angle += piece.spin;
        piece.vy += 0.015; // gravity

        if (piece.y > height + 30) {
          piece.y = -20;
          piece.x = Math.random() * width;
          piece.vy = 2 + Math.random() * 3;
        }

        ctx!.save();
        ctx!.translate(piece.x, piece.y);
        ctx!.rotate(piece.angle);
        ctx!.fillStyle = piece.color;
        ctx!.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2);
        ctx!.restore();
      }

      // ~8 seconds then stop, so a forgotten modal does not burn battery.
      if (frames < 480) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pieces]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[70] h-dvh w-screen"
    />
  );
}

export function FinishCard({
  open,
  preview,
  title,
  stars,
  badge,
  onClose,
  onDownload,
  onPrint,
  onShare,
  canShare,
}: {
  open: boolean;
  preview: string | null;
  title: string;
  stars: number;
  badge: Badge | null;
  onClose: () => void;
  onDownload: () => void;
  onPrint: () => void;
  onShare: () => void;
  canShare: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <Confetti />
      <div
        className="fixed inset-0 z-[80] grid place-items-center bg-ink/60 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="finish-title"
        onClick={onClose}
      >
        <div
          className="animate-pop card-kid relative w-full max-w-md overflow-hidden p-6 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="tap-big absolute top-2 right-2 grid place-items-center rounded-2xl text-ink-soft transition hover:bg-cream"
          >
            <X className="size-5" aria-hidden />
          </button>

          <span
            aria-hidden
            className="mx-auto grid size-14 place-items-center rounded-3xl border border-edge bg-butter text-white"
          >
            <PartyPopper className="size-7" />
          </span>
          <h2 id="finish-title" className="mt-1 font-display text-2xl font-extrabold text-ink">
            Beautiful work!
          </h2>
          <p className="mt-1 text-sm font-bold text-ink-soft">You finished “{title}”</p>

          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Your finished coloring"
              className="mx-auto mt-4 max-h-56 w-auto rounded-2xl border border-edge bg-white object-contain shadow-[var(--shadow-card-lift)]"
            />
          )}

          <div className="mt-4 flex items-center justify-center gap-1.5 font-display text-lg font-extrabold text-sunny-dark">
            {Array.from({ length: 3 }, (_, i) => (
              <Star key={i} className="size-5 fill-sunny text-sunny" aria-hidden />
            ))}
            <span className="ml-1 text-ink">+3 stars</span>
          </div>
          <p className="mt-1 text-xs font-bold text-ink-soft">{stars} stars collected so far</p>

          {badge && (
            <div className="mt-4 rounded-2xl border border-sunny/40 bg-sunny/18 p-3">
              <p className="font-display text-xs font-extrabold tracking-wide text-sunny-dark uppercase">
                New badge unlocked!
              </p>
              <p className="mt-1 flex items-center justify-center gap-1.5 font-display text-lg font-extrabold text-ink">
                <badge.icon className="size-5 text-sunny-dark" aria-hidden />
                {badge.label}
              </p>
            </div>
          )}

          <div className={cn('mt-5 grid gap-2', canShare ? 'grid-cols-3' : 'grid-cols-2')}>
            <button
              type="button"
              onClick={onDownload}
              className="btn-kid btn-mint flex-col !gap-0.5 py-3 text-xs"
            >
              <Download className="size-5" aria-hidden />
              Save
            </button>
            <button
              type="button"
              onClick={onPrint}
              className="btn-kid btn-sky flex-col !gap-0.5 py-3 text-xs"
            >
              <Printer className="size-5" aria-hidden />
              Print
            </button>
            {canShare && (
              <button
                type="button"
                onClick={onShare}
                className="btn-kid btn-sunny flex-col !gap-0.5 py-3 text-xs"
              >
                <Share2 className="size-5" aria-hidden />
                Share
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
