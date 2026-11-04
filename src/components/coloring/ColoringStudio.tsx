'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, Eye, Loader2, PartyPopper, Printer, Share2, Sparkles } from 'lucide-react';
import { useColoringEngine } from './useColoringEngine';
import { Palette, PaletteStrip } from './Palette';
import { MobileDock, Toolbar } from './Toolbar';
import { StickerTray } from './StickerTray';
import { FinishCard } from './Celebration';
import { awardFinish, readRewards, type Badge } from './storage';
import { play } from './sounds';
import { cn } from '@/lib/utils';

type Tab = 'colors' | 'tools' | 'stickers';

export interface ColoringStudioProps {
  slug: string;
  title: string;
  /** Same-origin line-art URL (/api/file/...) so the canvas stays readable. */
  imageUrl: string;
  referenceUrl?: string | null;
  suggestedColors?: string[];
  siteName: string;
  watermark?: string | null;
  soundDefault?: boolean;
  confettiEnabled?: boolean;
  rewardsEnabled?: boolean;
  guideEnabled?: boolean;
  downloadsEnabled?: boolean;
}

async function beacon(slug: string, event: string) {
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, event, path: `/color/${slug}` }),
      keepalive: true,
    });
  } catch {
    // Analytics must never interrupt play.
  }
}

export function ColoringStudio({
  slug,
  title,
  imageUrl,
  referenceUrl,
  suggestedColors = [],
  siteName,
  watermark,
  soundDefault = true,
  confettiEnabled = true,
  rewardsEnabled = true,
  guideEnabled = true,
  downloadsEnabled = true,
}: ColoringStudioProps) {
  const onFirstStroke = useCallback(() => void beacon(slug, 'color_start'), [slug]);

  const engine = useColoringEngine({
    slug,
    imageUrl,
    referenceUrl,
    watermark,
    soundDefault,
    onFirstStroke,
  });

  const [tab, setTab] = useState<Tab>('colors');
  const [finished, setFinished] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [badge, setBadge] = useState<Badge | null>(null);
  const [stars, setStars] = useState(0);
  const [printSrc, setPrintSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | 'save' | 'print' | 'share'>(null);
  const [canShare, setCanShare] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
    setStars(readRewards().stars);
  }, []);

  // Switch the side panel to match the tool the child just picked.
  useEffect(() => {
    if (engine.tool === 'sticker') setTab('stickers');
    else if (engine.tool === 'brush' || engine.tool === 'eraser') setTab('tools');
  }, [engine.tool]);

  const download = useCallback(async () => {
    setBusy('save');
    try {
      const blob = await engine.exportBlob(1.5);
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${slug}-my-coloring.png`;
      anchor.click();
      URL.revokeObjectURL(url);
      play('sparkle');
    } finally {
      setBusy(null);
    }
  }, [engine, slug]);

  const print = useCallback(async () => {
    setBusy('print');
    try {
      const blob = await engine.exportBlob(2);
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      setPrintSrc(url);
      void beacon(slug, 'print');

      // Let the <img> paint before the print dialog grabs the page.
      await new Promise((resolve) => setTimeout(resolve, 220));
      window.print();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        setPrintSrc(null);
      }, 1500);
    } finally {
      setBusy(null);
    }
  }, [engine, slug]);

  const share = useCallback(async () => {
    setBusy('share');
    try {
      const blob = await engine.exportBlob(1.2);
      if (!blob) return;

      const file = new File([blob], `${slug}-my-coloring.png`, { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `My ${title} coloring`,
          text: `I coloured this on ${siteName}!`,
        });
      } else {
        await download();
      }
    } catch {
      // User dismissed the share sheet - nothing to do.
    } finally {
      setBusy(null);
    }
  }, [download, engine, siteName, slug, title]);

  const finish = useCallback(() => {
    setPreview(engine.exportDataUrl(0.6));

    if (rewardsEnabled) {
      const { rewards, newBadge } = awardFinish(slug);
      setStars(rewards.stars);
      setBadge(newBadge);
    }

    void beacon(slug, 'color_finish');
    setFinished(true);
    play('fanfare');
  }, [engine, rewardsEnabled, slug]);

  const progress = Math.min(100, Math.round(engine.coverage * 100));

  const panel = useMemo(
    () => (
      <>
        <div className="mb-3 grid grid-cols-3 gap-1.5 rounded-2xl bg-cream p-1.5">
          {(
            [
              ['colors', '🎨 Colours'],
              ['tools', '🛠️ Tools'],
              ['stickers', '🌟 Stickers'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className={cn(
                'rounded-xl px-2 py-2 font-display text-xs font-extrabold transition',
                tab === id ? 'bg-white text-grape-700 shadow-sm' : 'text-ink-soft hover:text-ink',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'colors' && (
          <Palette
            color={engine.color}
            onPick={engine.setColor}
            suggested={suggestedColors}
            eyedropper={engine.eyedropper}
            onToggleEyedropper={() => engine.setEyedropper(!engine.eyedropper)}
          />
        )}

        {tab === 'tools' && (
          <Toolbar
            tool={engine.tool}
            onTool={engine.setTool}
            brush={engine.brush}
            onBrush={engine.setBrush}
            brushSize={engine.brushSize}
            onBrushSize={engine.setBrushSize}
            canUndo={engine.canUndo}
            canRedo={engine.canRedo}
            onUndo={engine.undo}
            onRedo={engine.redo}
            onReset={engine.reset}
            sound={engine.sound}
            onSound={engine.setSound}
            zoom={engine.view.z}
            onZoomIn={engine.zoomIn}
            onZoomOut={engine.zoomOut}
            onResetView={engine.resetView}
          />
        )}

        {tab === 'stickers' && (
          <StickerTray
            sticker={engine.sticker}
            onSticker={engine.setSticker}
            size={engine.stickerSize}
            onSize={engine.setStickerSize}
          />
        )}

        {guideEnabled && engine.hasReference && (
          <div className="mt-4 rounded-2xl bg-sky/10 p-3">
            <label
              htmlFor="guide-slider"
              className="flex items-center gap-1.5 font-display text-[11px] font-extrabold tracking-wide text-ink-soft uppercase"
            >
              <Eye className="size-3.5" aria-hidden /> Guide peek
            </label>
            <input
              id="guide-slider"
              type="range"
              min={0}
              max={70}
              step={5}
              value={engine.guide}
              onChange={(e) => engine.setGuide(Number(e.target.value))}
              className="mt-2 w-full accent-sky-dark"
            />
            <p className="mt-1 text-[11px] font-bold text-ink-soft">
              Slide to peek at the suggested colours.
            </p>
          </div>
        )}
      </>
    ),
    [engine, guideEnabled, suggestedColors, tab],
  );

  return (
    <>
      <div className="no-print grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* ---------------- stage ---------------- */}
        <div className="min-w-0">
          <div
            ref={stageRef}
            className="relative overflow-hidden rounded-[2rem] border-4 border-white bg-cream-deep shadow-[0_10px_0_rgba(43,33,64,0.08)]"
          >
            {engine.status === 'loading' && (
              <div className="grid aspect-[4/3] place-items-center">
                <div className="text-center">
                  <Loader2 className="mx-auto size-10 animate-spin text-grape-500" aria-hidden />
                  <p className="mt-3 font-display font-extrabold text-ink-soft">
                    Getting your crayons ready…
                  </p>
                </div>
              </div>
            )}

            {engine.status === 'error' && (
              <div className="grid aspect-[4/3] place-items-center p-6 text-center">
                <div>
                  <p className="text-5xl" aria-hidden>
                    😿
                  </p>
                  <p className="mt-3 font-display text-lg font-extrabold text-ink">Oops!</p>
                  <p className="mt-1 text-sm font-bold text-ink-soft">{engine.error}</p>
                </div>
              </div>
            )}

            <div
              className={cn(
                'relative touch-none select-none',
                engine.status !== 'ready' && 'hidden',
                engine.tool === 'pan' ? 'cursor-grab' : 'cursor-crosshair',
                engine.eyedropper && 'cursor-copy',
              )}
              onPointerDown={engine.onPointerDown}
              onPointerMove={engine.onPointerMove}
              onPointerUp={engine.onPointerUp}
              onPointerCancel={engine.onPointerUp}
              onPointerLeave={engine.onPointerUp}
              onWheel={engine.onWheel}
              onContextMenu={(e) => e.preventDefault()}
            >
              <div
                className="relative mx-auto origin-center transition-transform duration-75 will-change-transform"
                style={{
                  transform: engine.transform,
                  aspectRatio: engine.size.width
                    ? `${engine.size.width} / ${engine.size.height}`
                    : '4 / 3',
                }}
              >
                {/* faint colour guide underneath everything */}
                {referenceUrl && engine.guide > 0 && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={referenceUrl}
                    alt=""
                    aria-hidden
                    className="pointer-events-none absolute inset-0 size-full object-contain"
                    style={{ opacity: engine.guide / 100 }}
                  />
                )}

                <canvas
                  ref={engine.paintRef}
                  className="absolute inset-0 size-full"
                  aria-label={`Coloring area for ${title}`}
                />
                <canvas
                  ref={engine.lineRef}
                  className="pointer-events-none absolute inset-0 size-full"
                  aria-hidden
                />
              </div>
            </div>

            {engine.restored && engine.status === 'ready' && (
              <div className="animate-pop absolute top-3 left-3 flex items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 shadow-md">
                <Sparkles className="size-4 text-sunny-dark" aria-hidden />
                <span className="font-display text-xs font-extrabold text-ink">
                  We saved your work!
                </span>
                <button
                  type="button"
                  onClick={engine.reset}
                  className="rounded-lg bg-cream-deep px-2 py-1 font-display text-[11px] font-extrabold text-ink-soft hover:text-ink"
                >
                  Start fresh
                </button>
              </div>
            )}
          </div>

          {/* progress + actions */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <div
                className="h-3 flex-1 overflow-hidden rounded-full bg-white"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Coloring progress"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sunny via-coral to-grape-500 transition-[width] duration-500"
                  style={{ width: `${Math.max(progress, 2)}%` }}
                />
              </div>
              <span className="font-display text-xs font-extrabold text-ink-soft">
                {progress}% coloured
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={finish}
                disabled={engine.status !== 'ready'}
                className="btn-kid btn-coral flex-1 sm:flex-none"
              >
                <PartyPopper className="size-5" aria-hidden />
                I&apos;m done!
              </button>

              {downloadsEnabled && (
                <>
                  <button
                    type="button"
                    onClick={download}
                    disabled={engine.status !== 'ready' || busy === 'save'}
                    className="btn-kid btn-mint"
                  >
                    {busy === 'save' ? (
                      <Loader2 className="size-5 animate-spin" aria-hidden />
                    ) : (
                      <Download className="size-5" aria-hidden />
                    )}
                    Save PNG
                  </button>

                  <button
                    type="button"
                    onClick={print}
                    disabled={engine.status !== 'ready' || busy === 'print'}
                    className="btn-kid btn-sky"
                  >
                    {busy === 'print' ? (
                      <Loader2 className="size-5 animate-spin" aria-hidden />
                    ) : (
                      <Printer className="size-5" aria-hidden />
                    )}
                    Print
                  </button>
                </>
              )}

              {canShare && (
                <button
                  type="button"
                  onClick={share}
                  disabled={engine.status !== 'ready' || busy === 'share'}
                  className="btn-kid btn-ghost"
                >
                  <Share2 className="size-5" aria-hidden />
                  Share
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ---------------- side panel (desktop) ---------------- */}
        <aside className="card-kid hidden h-fit p-4 lg:sticky lg:top-24 lg:block">{panel}</aside>

        {/* ---------------- mobile controls ---------------- */}
        <div className="lg:hidden">
          <div className="card-kid mb-3 p-2">
            <PaletteStrip
              color={engine.color}
              onPick={engine.setColor}
              suggested={suggestedColors}
            />
          </div>
          <div className="card-kid p-4">{panel}</div>
        </div>
      </div>

      {/* sticky thumb dock on phones */}
      <div className="no-print pointer-events-none fixed inset-x-0 bottom-3 z-40 px-3 lg:hidden">
        <div className="pointer-events-auto mx-auto max-w-md">
          <MobileDock
            tool={engine.tool}
            onTool={engine.setTool}
            canUndo={engine.canUndo}
            onUndo={engine.undo}
          />
        </div>
      </div>

      <FinishCard
        open={finished && confettiEnabled}
        preview={preview}
        title={title}
        stars={stars}
        badge={badge}
        canShare={canShare}
        onClose={() => setFinished(false)}
        onDownload={download}
        onPrint={print}
        onShare={share}
      />

      {/* print-only artwork */}
      {printSrc && (
        <div className="hidden print:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={printSrc} alt={`${title} coloring`} className="print-art mx-auto" />
        </div>
      )}
    </>
  );
}
