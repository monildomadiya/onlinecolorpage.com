'use client';

import { STICKER_GROUPS, STICKER_SIZES } from './constants';
import { cn } from '@/lib/utils';

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
    <div className={cn('space-y-3', className)}>
      <div>
        <p className="mb-1.5 font-display text-[11px] font-extrabold tracking-wide text-ink-soft uppercase">
          Sticker size
        </p>
        <div className="flex items-center gap-2">
          {STICKER_SIZES.map((value, i) => (
            <button
              key={value}
              type="button"
              onClick={() => onSize(value)}
              aria-pressed={size === value}
              aria-label={['Tiny', 'Small', 'Big', 'Huge'][i]}
              className={cn(
                'tap-big grid flex-1 place-items-center rounded-2xl font-display text-xs font-extrabold transition',
                size === value
                  ? 'bg-grape-500 text-white'
                  : 'bg-white text-ink-soft shadow-[0_3px_0_var(--color-cream-deep)] hover:bg-cream',
              )}
            >
              {['S', 'M', 'L', 'XL'][i]}
            </button>
          ))}
        </div>
      </div>

      {STICKER_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 font-display text-[11px] font-extrabold tracking-wide text-ink-soft uppercase">
            {group.label}
          </p>
          <div className="grid grid-cols-8 gap-1.5">
            {group.items.map((glyph) => (
              <button
                key={glyph}
                type="button"
                onClick={() => onSticker(glyph)}
                aria-pressed={sticker === glyph}
                aria-label={`Sticker ${glyph}`}
                className={cn(
                  'grid aspect-square place-items-center rounded-xl text-xl transition hover:scale-110',
                  sticker === glyph ? 'bg-grape-100 ring-2 ring-grape-500' : 'bg-white',
                )}
              >
                <span aria-hidden>{glyph}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <p className="rounded-2xl bg-sunny/15 px-3 py-2 text-xs font-bold text-ink-soft">
        Tip: pick a sticker, then tap the picture to place it. Undo removes the last one.
      </p>
    </div>
  );
}
