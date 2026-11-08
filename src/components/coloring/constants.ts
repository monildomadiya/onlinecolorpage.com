/** Tunables and asset lists for the coloring studio. */

import {
  Brush,
  Eraser,
  Hand,
  PaintBucket,
  Pencil,
  PenLine,
  Rainbow,
  Sparkles,
  Stamp,
  Sticker,
  type LucideIcon,
} from 'lucide-react';

export type ToolId = 'fill' | 'brush' | 'eraser' | 'sticker' | 'pan';
export type BrushId = 'marker' | 'crayon' | 'rainbow' | 'glitter' | 'stamp';

/* ------------------------------------------------------------------ */
/*  engine tunables                                                    */
/* ------------------------------------------------------------------ */

/** Longest side the working canvas is scaled to. Keeps flood fill snappy. */
export const MAX_CANVAS_SIDE = 1400;

/**
 * A pixel blocks flood fill when its "ink alpha" (how far its darkest channel
 * sits from white) is at least this. 100 => anything darker than ~61% grey is
 * treated as a line.
 */
export const BARRIER_INK = 100;

/**
 * Ink at or above this is the solid core of an outline, and the fill stops
 * there. Set high on purpose: a pixel at 230 ink is still 10% see-through, so
 * leaving white paper under it shows as a pale thread along the line. Painting
 * under it cannot leak anywhere - the bleed only ever touches pixels that are
 * already barrier, never the open region on the other side.
 */
export const CORE_INK = 235;

/**
 * How many pixels a fill runs *under* the outline once the region is done.
 *
 * The barrier sits on the anti-aliased edge of the line and CLOSE_GAPS pushes
 * it one pixel further out again, so a fill that stopped dead at the barrier
 * would leave a rim of untouched white paper around every shape. Two pixels
 * covers the soft edge plus the gap-closing ring.
 */
export const FILL_BLEED = 2;

/** Grow the barrier mask by 1px to close hairline gaps that leak fills. */
export const CLOSE_GAPS = true;

/** How close a pixel must be to the clicked colour to be part of the region. */
export const FILL_TOLERANCE = 42;

export const MAX_UNDO = 24;
export const AUTOSAVE_DELAY = 1400;

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 6;

/* ------------------------------------------------------------------ */
/*  palette - a classic crayon box                                     */
/* ------------------------------------------------------------------ */

export const PALETTE_ROWS: { label: string; colors: string[] }[] = [
  {
    label: 'Brights',
    colors: [
      '#FF3B30', '#FF6B81', '#FF8A3D', '#FFC83D', '#FFE44D', '#A3E635',
      '#34D399', '#14B8A6', '#38BDF8', '#3B82F6', '#8B4FF5', '#D946EF',
    ],
  },
  {
    label: 'Softs',
    colors: [
      '#FFB3B3', '#FFD1DC', '#FFD8A8', '#FFF3B0', '#FDFFB6', '#D9F99D',
      '#A7F3D0', '#99F6E4', '#BAE6FD', '#C7D2FE', '#DDD6FE', '#F5D0FE',
    ],
  },
  {
    label: 'Deeps',
    colors: [
      '#7F1D1D', '#9D174D', '#9A3412', '#92400E', '#854D0E', '#3F6212',
      '#065F46', '#115E59', '#075985', '#1E3A8A', '#4C1D95', '#701A75',
    ],
  },
  {
    label: 'Skin & hair',
    colors: [
      '#FFE0BD', '#F1C27D', '#E0AC69', '#C68642', '#8D5524', '#5C3317',
      '#F5F5DC', '#D2B48C', '#A0522D', '#4A2511', '#2B1B17', '#B0B0B0',
    ],
  },
  {
    label: 'Greys',
    colors: [
      '#FFFFFF', '#F3F4F6', '#D1D5DB', '#9CA3AF', '#6B7280', '#4B5563',
      '#374151', '#1F2937', '#111827', '#000000', '#C0C0C0', '#8B7355',
    ],
  },
];

export const QUICK_COLORS = PALETTE_ROWS[0].colors;

/* ------------------------------------------------------------------ */
/*  brushes                                                            */
/* ------------------------------------------------------------------ */

export const BRUSHES: { id: BrushId; label: string; icon: LucideIcon; hint: string }[] = [
  { id: 'marker', label: 'Marker', icon: PenLine, hint: 'Smooth solid lines' },
  { id: 'crayon', label: 'Crayon', icon: Pencil, hint: 'Soft waxy texture' },
  { id: 'rainbow', label: 'Rainbow', icon: Rainbow, hint: 'Colour changes as you draw' },
  { id: 'glitter', label: 'Glitter', icon: Sparkles, hint: 'Sparkly scattered dots' },
  { id: 'stamp', label: 'Stamps', icon: Stamp, hint: 'Trail of little shapes' },
];

export const BRUSH_SIZES = [6, 12, 22, 38, 60];

/** Shapes the stamp brush trails along a stroke. */
export const STAMP_SHAPES = ['★', '♥', '●', '✿', '✦'] as const;

/* ------------------------------------------------------------------ */
/*  stickers                                                           */
/* ------------------------------------------------------------------ */

export const STICKER_GROUPS: { label: string; items: string[] }[] = [
  { label: 'Faces', items: ['😀', '😍', '🤩', '😎', '🥳', '😺', '🐶', '🐰'] },
  { label: 'Nature', items: ['🌞', '🌈', '⭐', '🌸', '🌳', '🍀', '🦋', '🐞'] },
  { label: 'Fun', items: ['🎈', '🎁', '🍭', '🍦', '🎨', '👑', '🚀', '⚽'] },
  { label: 'Hearts', items: ['❤️', '🧡', '💛', '💚', '💙', '💜', '💖', '✨'] },
];

export const STICKER_SIZES = [48, 80, 120, 170];

/* ------------------------------------------------------------------ */
/*  tools                                                              */
/* ------------------------------------------------------------------ */

export const TOOLS: { id: ToolId; label: string; icon: LucideIcon; key: string }[] = [
  { id: 'fill', label: 'Fill', icon: PaintBucket, key: 'f' },
  { id: 'brush', label: 'Draw', icon: Brush, key: 'b' },
  { id: 'eraser', label: 'Erase', icon: Eraser, key: 'e' },
  { id: 'sticker', label: 'Stickers', icon: Sticker, key: 's' },
  { id: 'pan', label: 'Move', icon: Hand, key: 'h' },
];
