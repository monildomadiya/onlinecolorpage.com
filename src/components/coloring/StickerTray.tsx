'use client';

import { STICKER_GROUPS, STICKER_SIZES } from './constants';
import { cn } from '@/lib/utils';

const SIZE_LABELS = ['S', 'M', 'L', 'XL'];
const SIZE_NAMES = ['Tiny', 'Small', 'Big', 'Huge'];

/**
 * Stickers, shown under the canvas only while the sticker tool is in hand.
 *
 * One scrolling line per group rather than a fixed eight-column grid: the
 * grid overflowed on a phone and left dead space on a desktop, while a track
 * that scrolls fits any width and keeps the card short.
 */
export function StickerTray({
  sticker,
  onSticker,
  size,
  onSize,
  className,
}: {
  sticker: string;
  onSticker: (glyph: string) => void;
  size: number;
  onSize: (size: number) => void;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0 space-y-3', className)}>
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[0.7rem] font-semibold tracking-[0.12em] text-ink-soft uppercase">
            Size
          </span>
          <div className="flex items-center gap-1.5">
            {STICKER_SIZES.map((value, i) => (
              <button
                key={value}
                type="button"
                onClick={() => onSize(value)}
                aria-pressed={size === value}
                aria-label={SIZE_NAMES[i]}
                className={cn(
                  'grid size-9 place-items-center rounded-full border text-xs font-semibold transition',
                  size === value
                    ? 'border-transparent bg-coral text-white'
                    : 'border-edge bg-white text-ink-soft hover:text-coral',
                )}
              >
                {SIZE_LABELS[i]}
              </button>
            ))}
          </div>
        </div>

        <p className="min-w-0 flex-1 basis-56 text-xs text-ink-soft">
          Pick a sticker, then tap the picture to place it.
        </p>
      </div>

      {STICKER_GROUPS.map((group) => (
        <div key={group.label} className="flex min-w-0 items-center gap-2">
          <span className="w-14 shrink-0 text-[0.7rem] font-semibold tracking-[0.12em] text-ink-soft uppercase">
            {group.label}
          </span>
          <div className="no-scrollbar -my-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto py-1">
            {group.items.map((glyph) => (
              <button
                key={glyph}
                type="button"
                onClick={() => onSticker(glyph)}
                aria-pressed={sticker === glyph}
                aria-label={`Sticker ${glyph}`}
                className={cn(
                  'grid size-9 shrink-0 place-items-center rounded-full border text-lg transition hover:scale-110',
                  sticker === glyph
                    ? 'border-coral bg-coral/10'
                    : 'border-edge bg-white hover:border-coral/40',
                )}
              >
                <span aria-hidden>{glyph}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
