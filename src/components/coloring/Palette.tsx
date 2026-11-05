'use client';

import { useState } from 'react';
import { Check, Pipette, Plus } from 'lucide-react';
import { PALETTE_ROWS } from './constants';
import { luminance, hexToRgb } from './engine';
import { cn } from '@/lib/utils';

function isLight(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex);
  return luminance(r, g, b) > 186;
}

function Swatch({
  value,
  active,
  onPick,
}: {
  value: string;
  active: boolean;
  onPick: (color: string) => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Colour ${value}`}
      aria-pressed={active}
      title={value}
      onClick={() => onPick(value)}
      className={cn(
        'relative size-9 shrink-0 rounded-xl transition-transform sm:size-8',
        'hover:scale-110 active:scale-95',
        active &&
          'scale-110 ring-2 ring-white shadow-[0_0_0_3px_rgb(28_22_48_/_0.45),0_6px_16px_-6px_rgb(28_22_48_/_0.5)]',
        isLight(value) && 'border border-black/10',
      )}
      style={{ background: value }}
    >
      {active && (
        <span
          aria-hidden
          className={cn(
            'absolute inset-0 grid place-items-center',
            isLight(value) ? 'text-ink' : 'text-white',
          )}
        >
          <Check className="size-4" strokeWidth={3.5} />
        </span>
      )}
    </button>
  );
}

export function Palette({
  color,
  onPick,
  suggested = [],
  eyedropper,
  onToggleEyedropper,
  className,
}: {
  color: string;
  onPick: (color: string) => void;
  suggested?: string[];
  eyedropper: boolean;
  onToggleEyedropper: () => void;
  className?: string;
}) {
  const [custom, setCustom] = useState(color);
  const [recent, setRecent] = useState<string[]>([]);

  function pick(next: string) {
    onPick(next);
    setRecent((prev) => [next, ...prev.filter((c) => c !== next)].slice(0, 8));
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="size-11 shrink-0 rounded-2xl border-2 border-white shadow-[0_0_0_1px_rgb(28_22_48_/_0.12),0_10px_22px_-10px_rgb(28_22_48_/_0.55)]"
          style={{ background: color }}
        />
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-extrabold text-ink">Your colour</p>
          <p className="font-mono text-xs font-bold text-ink-soft">{color}</p>
        </div>

        <label
          className="tap-big grid cursor-pointer place-items-center rounded-2xl border border-ink/10 bg-white text-grape-700 transition hover:bg-cream-deep"
          title="Pick any colour"
        >
          <Plus className="size-5" aria-hidden />
          <span className="sr-only">Choose a custom colour</span>
          <input
            type="color"
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              pick(e.target.value.toUpperCase());
            }}
            className="sr-only"
          />
        </label>

        <button
          type="button"
          onClick={onToggleEyedropper}
          aria-pressed={eyedropper}
          title="Copy a colour from the picture"
          className={cn(
            'tap-big grid place-items-center rounded-2xl border transition',
            eyedropper
              ? 'border-ink/10 bg-coral text-white'
              : 'border-ink/10 bg-white text-grape-700 hover:bg-cream-deep',
          )}
        >
          <Pipette className="size-5" aria-hidden />
          <span className="sr-only">Eyedropper</span>
        </button>
      </div>

      {suggested.length > 0 && (
        <div>
          <p className="mb-1.5 font-display text-[11px] font-extrabold tracking-wide text-ink-soft uppercase">
            Suggested for this picture
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggested.map((value) => (
              <Swatch key={`s-${value}`} value={value} active={color === value} onPick={pick} />
            ))}
          </div>
        </div>
      )}

      {recent.length > 1 && (
        <div>
          <p className="mb-1.5 font-display text-[11px] font-extrabold tracking-wide text-ink-soft uppercase">
            Recent
          </p>
          <div className="flex flex-wrap gap-1.5">
            {recent.map((value) => (
              <Swatch key={`r-${value}`} value={value} active={color === value} onPick={pick} />
            ))}
          </div>
        </div>
      )}

      {PALETTE_ROWS.map((row) => (
        <div key={row.label}>
          <p className="mb-1.5 font-display text-[11px] font-extrabold tracking-wide text-ink-soft uppercase">
            {row.label}
          </p>
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-6">
            {row.colors.map((value) => (
              <Swatch key={value} value={value} active={color === value} onPick={pick} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * The vertical colour rail that sits against the left edge of the canvas on
 * wide screens.
 *
 * Every colour is on screen at once, three to a row, with no tabs or groups in
 * the way: on a drawing surface the palette should be a thing you reach for,
 * not a menu you navigate. The current colour sits at the top where it doubles
 * as the"what am I painting with" indicator.
 */
export function PaletteColumn({
  color,
  onPick,
  suggested = [],
  eyedropper,
  onToggleEyedropper,
  className,
}: {
  color: string;
  onPick: (color: string) => void;
  suggested?: string[];
  eyedropper: boolean;
  onToggleEyedropper: () => void;
  className?: string;
}) {
  const [custom, setCustom] = useState(color);
  const colors = [...new Set([...suggested, ...PALETTE_ROWS.flatMap((row) => row.colors)])];

  return (
    <div
      className={cn(
        'glass flex flex-col items-center gap-2 rounded-2xl border-sky/45 p-2',
        className,
      )}
    >
      <span
        aria-hidden
        title={color}
        className="h-10 w-full shrink-0 rounded-xl border border-ink/10"
        style={{ background: color }}
      />

      <div className="flex w-full gap-1">
        <label
          className="grid h-8 flex-1 cursor-pointer place-items-center rounded-lg border border-ink/10 bg-white text-grape-700 transition hover:bg-cream-deep"
          title="Pick any colour"
        >
          <Plus className="size-4" aria-hidden />
          <span className="sr-only">Choose a custom colour</span>
          <input
            type="color"
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              onPick(e.target.value.toUpperCase());
            }}
            className="sr-only"
          />
        </label>

        <button
          type="button"
          onClick={onToggleEyedropper}
          aria-pressed={eyedropper}
          title="Copy a colour from the picture"
          className={cn(
            'grid h-8 flex-1 place-items-center rounded-lg border transition',
            eyedropper
              ? 'border-ink/10 bg-coral text-white'
              : 'border-ink/10 bg-white text-grape-700 hover:bg-cream-deep',
          )}
        >
          <Pipette className="size-4" aria-hidden />
          <span className="sr-only">Eyedropper</span>
        </button>
      </div>

      <div className="no-scrollbar grid w-full grid-cols-3 gap-1 overflow-y-auto">
        {colors.map((value) => (
          <button
            key={value}
            type="button"
            aria-label={`Colour ${value}`}
            aria-pressed={color === value}
            title={value}
            onClick={() => onPick(value)}
            className={cn(
              'relative aspect-square w-full rounded-md transition-transform hover:scale-110',
              color === value && 'ring-2 ring-white shadow-[0_0_0_2px_rgb(28_22_48_/_0.5)]',
              isLight(value) && 'border border-black/10',
            )}
            style={{ background: value }}
          >
            {color === value && (
              <span
                aria-hidden
                className={cn(
                  'absolute inset-0 grid place-items-center',
                  isLight(value) ? 'text-ink' : 'text-white',
                )}
              >
                <Check className="size-3" strokeWidth={4} />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Compact horizontal strip for the mobile dock. */
export function PaletteStrip({
  color,
  onPick,
  suggested = [],
}: {
  color: string;
  onPick: (color: string) => void;
  suggested?: string[];
}) {
  const colors = [...new Set([...suggested, ...PALETTE_ROWS[0].colors, ...PALETTE_ROWS[1].colors])];

  return (
    <div className="no-scrollbar flex items-center gap-2 overflow-x-auto px-1 py-1">
      <label
        className="tap-big grid shrink-0 cursor-pointer place-items-center rounded-2xl border border-ink/10 bg-white text-grape-700"
        title="Any colour"
      >
        <Plus className="size-5" aria-hidden />
        <input
          type="color"
          value={color}
          onChange={(e) => onPick(e.target.value.toUpperCase())}
          className="sr-only"
        />
      </label>

      {colors.map((value) => (
        <Swatch key={value} value={value} active={color === value} onPick={onPick} />
      ))}
    </div>
  );
}
