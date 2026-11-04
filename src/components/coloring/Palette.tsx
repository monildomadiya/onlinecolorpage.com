'use client';

import { useState } from 'react';
import { Pipette, Plus } from 'lucide-react';
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
        active && 'scale-110 ring-3 ring-ink ring-offset-2 ring-offset-white',
        isLight(value) && 'border border-black/10',
      )}
      style={{ background: value }}
    >
      {active && (
        <span
          aria-hidden
          className={cn(
            'absolute inset-0 grid place-items-center text-xs font-black',
            isLight(value) ? 'text-ink' : 'text-white',
          )}
        >
          ✓
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
          className="size-11 shrink-0 rounded-2xl border-2 border-white shadow-[0_4px_0_rgba(43,33,64,0.12)]"
          style={{ background: color }}
        />
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-extrabold text-ink">Your colour</p>
          <p className="font-mono text-xs font-bold text-ink-soft">{color}</p>
        </div>

        <label
          className="tap-big grid cursor-pointer place-items-center rounded-2xl bg-cream-deep text-grape-700 transition hover:bg-grape-100"
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
            'tap-big grid place-items-center rounded-2xl transition',
            eyedropper
              ? 'bg-grape-500 text-white'
              : 'bg-cream-deep text-grape-700 hover:bg-grape-100',
          )}
        >
          <Pipette className="size-5" aria-hidden />
          <span className="sr-only">Eyedropper</span>
        </button>
      </div>

      {suggested.length > 0 && (
        <div>
          <p className="mb-1.5 font-display text-[11px] font-extrabold tracking-wide text-ink-soft uppercase">
            ✨ Suggested for this picture
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
        className="tap-big grid shrink-0 cursor-pointer place-items-center rounded-2xl bg-cream-deep text-grape-700"
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
