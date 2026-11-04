/** Tunables and asset lists for the coloring studio. */

export type ToolId = 'fill' | 'brush' | 'eraser' | 'sticker' | 'pan';
export type BrushId = 'marker' | 'crayon' | 'rainbow' | 'glitter' | 'stamp';

/* ------------------------------------------------------------------ */
/*  engine tunables                                                    */
/* ------------------------------------------------------------------ */

/** Longest side the working canvas is scaled to. Keeps flood fill snappy. */
export const MAX_CANVAS_SIDE = 1400;

/**
 * A pixel blocks flood fill when its "ink alpha" (255 - luminance) is at least
 * this. 100 => anything darker than ~61% grey is treated as a line. Soft
 * anti-aliased edges below it get painted over, then the line layer re-draws on
 * top, which is what makes fills look clean right up to the outline.
 */
export const BARRIER_INK = 100;

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

export const BRUSHES: { id: BrushId; label: string; emoji: string; hint: string }[] = [
  { id: 'marker', label: 'Marker', emoji: '🖊️', hint: 'Smooth solid lines' },
  { id: 'crayon', label: 'Crayon', emoji: '🖍️', hint: 'Soft waxy texture' },
  { id: 'rainbow', label: 'Rainbow', emoji: '🌈', hint: 'Colour changes as you draw' },
  { id: 'glitter', label: 'Glitter', emoji: '✨', hint: 'Sparkly scattered dots' },
  { id: 'stamp', label: 'Stamps', emoji: '💗', hint: 'Trail of little shapes' },
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

export const TOOLS: { id: ToolId; label: string; emoji: string; key: string }[] = [
  { id: 'fill', label: 'Fill', emoji: '🪣', key: 'f' },
  { id: 'brush', label: 'Draw', emoji: '🖌️', key: 'b' },
  { id: 'eraser', label: 'Erase', emoji: '🧽', key: 'e' },
  { id: 'sticker', label: 'Stickers', emoji: '🌟', key: 's' },
  { id: 'pan', label: 'Move', emoji: '✋', key: 'h' },
];
