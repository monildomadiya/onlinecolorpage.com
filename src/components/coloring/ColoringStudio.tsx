'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CircleAlert,
  Download,
  Eye,
  Loader2,
  PartyPopper,
  Printer,
  Share2,
  Sparkles,
} from 'lucide-react';
import { useColoringEngine } from './useColoringEngine';
import { ColorPicker } from './Palette';
import { BrushOptions, ToolBar, ViewBar } from './Toolbar';
import { StickerTray } from './StickerTray';
import { FinishCard } from './Celebration';
import { awardFinish, readRewards, type Badge } from './storage';
import { play } from './sounds';
import { cn } from '@/lib/utils';

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

/** How tall the artwork may get. Keeps the controls on screen on a laptop. */
const STAGE_CAP = 'min(58vh, 32rem)';

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

/**
 * The coloring studio.
 *
 * One centred column at every width - tools above the artwork, progress and
 * zoom below it, then the colours. There is no second desktop layout and no
 * floating phone dock: the same three cards simply get wider, which is what
 * keeps the page honest between 320px and a desktop, and what stops a
 * horizontally scrolling colour rail from dragging the page sideways.
 *
 * Tool options (brush style, sticker picker, the colour guide) are not in the
 * bar. They appear in their own card under the canvas only while that tool is
 * in hand, so the resting state is a picture, five chips and a row of colours.
 */
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
  const ratio = engine.size.width ? engine.size.width / engine.size.height : 4 / 3;

  const showBrush = engine.tool === 'brush' || engine.tool === 'eraser';
  const showStickers = engine.tool === 'sticker';
  const showGuide = guideEnabled && engine.hasReference;
  const hasOptions = showBrush || showStickers || showGuide;

  return (
    <>
      <div className="no-print mx-auto w-full min-w-0 max-w-4xl">
        {/* ------------------------- studio ------------------------- */}
        <div className="panel min-w-0 p-3 sm:p-4">
          <ToolBar
            tool={engine.tool}
            onTool={engine.setTool}
            canUndo={engine.canUndo}
            canRedo={engine.canRedo}
            onUndo={engine.undo}
            onRedo={engine.redo}
            className="mb-3"
          />

          <div
            ref={stageRef}
            className="relative overflow-hidden rounded-[1.25rem] border border-edge bg-cream/40 p-2 sm:p-3"
          >
            {engine.status === 'loading' && (
              <div className="grid aspect-[4/3] max-h-[58vh] place-items-center">
                <div className="text-center">
                  <Loader2 className="mx-auto size-9 animate-spin text-coral" aria-hidden />
                  <p className="mt-3 text-sm font-semibold text-ink-soft">
                    Getting your crayons ready…
                  </p>
                </div>
              </div>
            )}

            {engine.status === 'error' && (
              <div className="grid aspect-[4/3] max-h-[58vh] place-items-center p-6 text-center">
                <div>
                  <CircleAlert className="mx-auto size-9 text-coral" aria-hidden />
                  <p className="mt-3 font-display text-lg text-ink">Oops!</p>
                  <p className="mt-1 text-sm text-ink-soft">{engine.error}</p>
                </div>
              </div>
            )}

            <div
              className={cn(
                'relative flex w-full touch-none items-center justify-center select-none',
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
              {/* The artwork fills the card's width, but never grows past the
                  height cap: capping the WIDTH at cap x ratio keeps the box
                  the right shape, which clamping the height alone would not. */}
              <div
                className="relative w-full origin-center overflow-hidden rounded-xl bg-white transition-transform duration-75 will-change-transform"
                style={{
                  transform: engine.transform,
                  aspectRatio: `${ratio}`,
                  maxWidth: `calc(${STAGE_CAP} * ${ratio})`,
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
              <div className="animate-pop absolute top-4 left-4 flex items-center gap-2 rounded-full border border-edge bg-white px-3 py-1.5 shadow-[var(--shadow-card)]">
                <Sparkles className="size-4 text-butter-dark" aria-hidden />
                <span className="text-xs font-semibold text-ink">We saved your work!</span>
                <button
                  type="button"
                  onClick={engine.reset}
                  className="rounded-full bg-cream px-2.5 py-1 text-[0.7rem] font-semibold text-ink-soft transition hover:text-coral"
                >
                  Start fresh
                </button>
              </div>
            )}
          </div>

          {/* progress + view controls */}
          <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex min-w-40 flex-1 items-center gap-2.5">
              <div
                className="h-2 flex-1 overflow-hidden rounded-full bg-cream"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Coloring progress"
              >
                <div
                  className="h-full rounded-full bg-coral transition-[width] duration-500"
                  style={{ width: `${Math.max(progress, 2)}%` }}
                />
              </div>
              <span className="shrink-0 text-xs font-semibold text-ink-soft tabular-nums">
                {progress}%
              </span>
            </div>

            <ViewBar
              zoom={engine.view.z}
              onZoomIn={engine.zoomIn}
              onZoomOut={engine.zoomOut}
              onResetView={engine.resetView}
              sound={engine.sound}
              onSound={engine.setSound}
              onReset={engine.reset}
              className="ml-auto"
            />
          </div>
        </div>

        {/* --------------------- tool options --------------------- */}
        {hasOptions && (
          <div className="panel mt-3 min-w-0 space-y-4 p-3 sm:p-4">
            {showBrush && (
              <BrushOptions
                tool={engine.tool}
                brush={engine.brush}
                onBrush={engine.setBrush}
                brushSize={engine.brushSize}
                onBrushSize={engine.setBrushSize}
              />
            )}

            {showStickers && (
              <StickerTray
                sticker={engine.sticker}
                onSticker={engine.setSticker}
                size={engine.stickerSize}
                onSize={engine.setStickerSize}
              />
            )}

            {showGuide && (
              <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
                <label
                  htmlFor="guide-slider"
                  className="inline-flex shrink-0 items-center gap-1.5 text-[0.7rem] font-semibold tracking-[0.12em] text-ink-soft uppercase"
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
                  className="h-2 min-w-40 flex-1 accent-coral"
                />
                <span className="shrink-0 text-xs text-ink-soft">
                  Peek at the suggested colours
                </span>
              </div>
            )}
          </div>
        )}

        {/* ----------------------- colours ----------------------- */}
        <div className="panel mt-3 min-w-0 p-3 sm:p-4">
          <ColorPicker
            color={engine.color}
            onPick={engine.setColor}
            suggested={suggestedColors}
            eyedropper={engine.eyedropper}
            onToggleEyedropper={() => engine.setEyedropper(!engine.eyedropper)}
          />
        </div>

        {/* ----------------------- actions ----------------------- */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={finish}
            disabled={engine.status !== 'ready'}
            className="btn-kid btn-coral flex-1 sm:flex-none"
          >
            <PartyPopper className="size-4.5" aria-hidden />
            I&apos;m done!
          </button>

          {downloadsEnabled && (
            <>
              <button
                type="button"
                onClick={download}
                disabled={engine.status !== 'ready' || busy === 'save'}
                className="btn-kid btn-ghost"
              >
                {busy === 'save' ? (
                  <Loader2 className="size-4.5 animate-spin" aria-hidden />
                ) : (
                  <Download className="size-4.5" aria-hidden />
                )}
                Save PNG
              </button>

              <button
                type="button"
                onClick={print}
                disabled={engine.status !== 'ready' || busy === 'print'}
                className="btn-kid btn-ghost"
              >
                {busy === 'print' ? (
                  <Loader2 className="size-4.5 animate-spin" aria-hidden />
                ) : (
                  <Printer className="size-4.5" aria-hidden />
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
              <Share2 className="size-4.5" aria-hidden />
              Share
            </button>
          )}
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
