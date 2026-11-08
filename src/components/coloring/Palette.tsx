'use client';

import { useState } from 'react';
import { Check, ChevronDown, Pipette, Plus } from 'lucide-react';
import { PALETTE_ROWS, QUICK_COLORS } from './constants';
import { luminance, hexToRgb } from './engine';
import { cn } from '@/lib/utils';

function isLight(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex);
  return luminance(r, g, b) > 186;
}

/** `fill` stretches the swatch to its grid cell; otherwise it is a fixed 36px. */
function Swatch({
  value,
  active,
  onPick,
  fill = false,
}: {
  value: string;
  active: boolean;
  onPick: (color: string) => void;
  fill?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={`Colour ${value}`}
      aria-pressed={active}
      title={value}
      onClick={() => onPick(value)}
      className={cn(
        'relative rounded-full transition-transform hover:scale-110 active:scale-95',
        fill ? 'aspect-square w-full' : 'size-9 shrink-0',
        active && 'scale-110 ring-2 ring-coral ring-offset-2 ring-offset-white',
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

/**
 * The colour picker, as one card under the canvas.
 *
 * Twelve bright colours plus whatever the artwork suggests sit on a single
 * scrolling line - that covers almost every pick a child makes. The rest of
 * the box is behind "All colours", where it opens into a grid that reflows to
 * whatever width it is given, so the same component works at 320px and on a
 * desktop without a second layout.
 *
 * Every scrolling track here is wrapped in a `min-w-0` flex child on purpose:
 * a horizontal scroller whose parent can grow will push the whole page wider
 * instead of scrolling.
 */
export function ColorPicker({
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
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);

  const quick = [...new Set([...suggested, ...QUICK_COLORS])];

  function pick(next: string) {
    onPick(next);
    setRecent((prev) => [next, ...prev.filter((c) => c !== next)].slice(0, 10));
  }

  return (
    <div className={cn('min-w-0', className)}>
      {/* One line on a tablet and up. On a phone the colours drop to a full
          row of their own (order-3 + basis-full), because sharing the line
          with four controls left them about two swatches of track. */}
      <div className="flex min-w-0 flex-wrap items-center gap-2.5">
        <span
          aria-hidden
          title={color}
          className="order-1 size-10 shrink-0 rounded-full border-2 border-white shadow-[0_0_0_1px_var(--color-edge)]"
          style={{ background: color }}
        />

        <div className="no-scrollbar order-3 -my-1 flex min-w-0 basis-full items-center gap-2 overflow-x-auto py-1 sm:order-2 sm:flex-1 sm:basis-0">
          {quick.map((value) => (
            <Swatch key={value} value={value} active={color === value} onPick={pick} />
          ))}
        </div>

        <div className="order-2 ml-auto flex shrink-0 items-center gap-1.5 sm:order-3 sm:ml-0">
          <label
            className="grid size-10 cursor-pointer place-items-center rounded-full border border-edge bg-white text-ink-soft transition hover:text-coral"
            title="Pick any colour"
          >
            <Plus className="size-4.5" aria-hidden />
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
              'grid size-10 place-items-center rounded-full border transition',
              eyedropper
                ? 'border-transparent bg-coral text-white'
                : 'border-edge bg-white text-ink-soft hover:text-coral',
            )}
          >
            <Pipette className="size-4.5" aria-hidden />
            <span className="sr-only">Eyedropper</span>
          </button>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-edge bg-white px-3 text-xs font-semibold text-ink-soft transition hover:text-coral"
          >
            <span className="hidden sm:inline">All colours</span>
            <span className="sm:hidden">More</span>
            <ChevronDown
              className={cn('size-4 transition-transform', open && 'rotate-180')}
              aria-hidden
            />
          </button>
        </div>
      </div>

      {open && (
        <div className="animate-pop mt-4 space-y-4 border-t border-edge pt-4">
          {recent.length > 1 && (
            <div>
              <p className="mb-2 text-[0.7rem] font-semibold tracking-[0.12em] text-ink-soft uppercase">
                Recent
              </p>
              <div className="flex flex-wrap gap-2">
                {recent.map((value) => (
                  <Swatch
                    key={`r-${value}`}
                    value={value}
                    active={color === value}
                    onPick={pick}
                  />
                ))}
              </div>
            </div>
          )}

          {PALETTE_ROWS.map((row) => (
            <div key={row.label}>
              <p className="mb-2 text-[0.7rem] font-semibold tracking-[0.12em] text-ink-soft uppercase">
                {row.label}
              </p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(2.25rem,1fr))] gap-2">
                {row.colors.map((value) => (
                  <Swatch key={value} value={value} active={color === value} onPick={pick} fill />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
