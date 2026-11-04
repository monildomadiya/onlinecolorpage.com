/**
 * Canvas engine for the coloring studio. Pure DOM/canvas code - no React.
 *
 * Two stacked canvases do the work:
 *   paint  (bottom) - everything the child paints, starts as white "paper"
 *   lines  (top)    - the artwork's outlines, background turned transparent
 *
 * Keeping the outlines on their own layer above the paint is what makes fills
 * look clean: the fill is allowed to run slightly *under* the anti-aliased edge
 * of a line, and the line then re-draws over it.
 */

import {
  BARRIER_INK,
  BRUSH_SIZES,
  CLOSE_GAPS,
  FILL_TOLERANCE,
  MAX_CANVAS_SIDE,
  STAMP_SHAPES,
  type BrushId,
} from './constants';

export interface LineArt {
  width: number;
  height: number;
  /** Outlines only, transparent elsewhere. */
  lineCanvas: HTMLCanvasElement;
  /** One byte per pixel: 1 = outline, flood fill stops here. */
  mask: Uint8Array;
}

export interface Point {
  x: number;
  y: number;
}

/* ------------------------------------------------------------------ */
/*  colour helpers                                                     */
/* ------------------------------------------------------------------ */

export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = Number.parseInt(h.slice(0, 6) || '000000', 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const hex = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`.toUpperCase();
}

/** Perceived brightness, 0-255. */
export function luminance(r: number, g: number, b: number): number {
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/* ------------------------------------------------------------------ */
/*  line-art preparation                                               */
/* ------------------------------------------------------------------ */

/** Grows the barrier by one pixel so 1-2px gaps in the artwork cannot leak. */
function closeGaps(mask: Uint8Array, width: number, height: number): void {
  const source = mask.slice();
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      const i = row + x;
      if (source[i]) continue;
      if (
        (x > 0 && source[i - 1]) ||
        (x < width - 1 && source[i + 1]) ||
        (y > 0 && source[i - width]) ||
        (y < height - 1 && source[i + width])
      ) {
        mask[i] = 1;
      }
    }
  }
}

/**
 * Rasterises the uploaded artwork into the line layer + barrier mask.
 *
 * Every pixel's "ink" value is `255 - luminance`, which becomes its alpha. Pure
 * white paper drops to alpha 0 and disappears; black lines stay opaque; grey
 * anti-aliasing stays soft. Coloured outlines keep their hue.
 */
export function prepareLineArt(
  source: HTMLImageElement | ImageBitmap,
  maxSide = MAX_CANVAS_SIDE,
): LineArt {
  const naturalWidth = 'naturalWidth' in source ? source.naturalWidth : source.width;
  const naturalHeight = 'naturalHeight' in source ? source.naturalHeight : source.height;

  const scale = Math.min(1, maxSide / Math.max(naturalWidth || 1, naturalHeight || 1));
  const width = Math.max(1, Math.round((naturalWidth || 1) * scale));
  const height = Math.max(1, Math.round((naturalHeight || 1) * scale));

  const lineCanvas = document.createElement('canvas');
  lineCanvas.width = width;
  lineCanvas.height = height;

  const ctx = lineCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas is not available in this browser.');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);

  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  const mask = new Uint8Array(width * height);

  for (let p = 0, i = 0; i < data.length; i += 4, p++) {
    const alpha = data[i + 3];

    let ink: number;
    if (alpha === 0) {
      ink = 0; // fully transparent source pixel is paper
    } else {
      ink = 255 - luminance(data[i], data[i + 1], data[i + 2]);
      if (alpha < 255) ink = (ink * alpha) / 255;
    }

    const value = ink < 0 ? 0 : ink > 255 ? 255 : Math.round(ink);
    data[i + 3] = value;
    if (value >= BARRIER_INK) mask[p] = 1;
  }

  ctx.putImageData(image, 0, 0);
  if (CLOSE_GAPS) closeGaps(mask, width, height);

  return { width, height, lineCanvas, mask };
}

/** Creates the paint layer, pre-filled with white so it reads as paper. */
export function createPaintCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  return canvas;
}

/* ------------------------------------------------------------------ */
/*  flood fill                                                         */
/* ------------------------------------------------------------------ */

/**
 * Span-based flood fill, bounded by the outline mask.
 *
 * Returns false when the tap landed on an outline or on a region that is
 * already the chosen colour, so the caller can play a "nope" instead of
 * pushing a pointless undo step.
 */
export function floodFill(
  ctx: CanvasRenderingContext2D,
  mask: Uint8Array,
  width: number,
  height: number,
  startX: number,
  startY: number,
  color: string,
  tolerance = FILL_TOLERANCE,
): boolean {
  const sx = Math.floor(startX);
  const sy = Math.floor(startY);
  if (sx < 0 || sy < 0 || sx >= width || sy >= height) return false;

  const origin = sy * width + sx;
  if (mask[origin]) return false;

  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;

  const t0 = data[origin * 4];
  const t1 = data[origin * 4 + 1];
  const t2 = data[origin * 4 + 2];

  const [r, g, b] = hexToRgb(color);

  // Already this colour (within a hair) - nothing to do.
  if (Math.abs(t0 - r) + Math.abs(t1 - g) + Math.abs(t2 - b) <= 6) return false;

  const tol = tolerance * 3; // we compare the sum of three channel deltas
  const done = new Uint8Array(width * height);

  const matches = (p: number): boolean => {
    if (mask[p] || done[p]) return false;
    const i = p * 4;
    return (
      Math.abs(data[i] - t0) + Math.abs(data[i + 1] - t1) + Math.abs(data[i + 2] - t2) <= tol
    );
  };

  const stack: number[] = [sx, sy];
  let painted = 0;

  while (stack.length > 0) {
    const y = stack.pop()!;
    let x = stack.pop()!;
    let p = y * width + x;

    // Walk to the start of this span.
    while (x > 0 && matches(p - 1)) {
      x--;
      p--;
    }

    let spanAbove = false;
    let spanBelow = false;

    while (x < width && matches(p)) {
      const i = p * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
      done[p] = 1;
      painted++;

      if (y > 0) {
        if (matches(p - width)) {
          if (!spanAbove) {
            stack.push(x, y - 1);
            spanAbove = true;
          }
        } else {
          spanAbove = false;
        }
      }

      if (y < height - 1) {
        if (matches(p + width)) {
          if (!spanBelow) {
            stack.push(x, y + 1);
            spanBelow = true;
          }
        } else {
          spanBelow = false;
        }
      }

      x++;
      p++;
    }
  }

  if (painted === 0) return false;

  ctx.putImageData(image, 0, 0);
  return true;
}

/** Colour under a point on the paint layer, for the eyedropper. */
export function pickColor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
): string {
  const { data } = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1);
  return rgbToHex(data[0], data[1], data[2]);
}

/* ------------------------------------------------------------------ */
/*  brushes                                                            */
/* ------------------------------------------------------------------ */

export interface StrokeStyle {
  brush: BrushId;
  color: string;
  size: number;
  /** Advances along the stroke; drives the rainbow brush and stamp spacing. */
  travel: number;
}

function setupSolid(ctx: CanvasRenderingContext2D, color: string, size: number) {
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

/**
 * Draws one segment of a stroke and returns the new travel distance.
 * Called per pointermove, so it must stay cheap.
 */
export function drawSegment(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  style: StrokeStyle,
): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  const travel = style.travel + distance;

  switch (style.brush) {
    case 'marker': {
      setupSolid(ctx, style.color, style.size);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      break;
    }

    case 'crayon': {
      // Three offset, semi-transparent passes read as waxy texture.
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = style.color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let pass = 0; pass < 3; pass++) {
        const jitter = style.size * 0.14;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = style.size * (0.7 + Math.random() * 0.45);
        ctx.beginPath();
        ctx.moveTo(from.x + (Math.random() - 0.5) * jitter, from.y + (Math.random() - 0.5) * jitter);
        ctx.lineTo(to.x + (Math.random() - 0.5) * jitter, to.y + (Math.random() - 0.5) * jitter);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    }

    case 'rainbow': {
      const hue = (travel * 1.4) % 360;
      setupSolid(ctx, `hsl(${hue} 92% 56%)`, style.size);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      break;
    }

    case 'glitter': {
      ctx.globalCompositeOperation = 'source-over';
      const steps = Math.max(1, Math.round(distance / 2));
      const spread = style.size * 0.7;
      const sparkles = Math.max(2, Math.round(style.size / 5));

      for (let s = 0; s <= steps; s++) {
        const t = steps === 0 ? 0 : s / steps;
        const cx = from.x + dx * t;
        const cy = from.y + dy * t;

        for (let k = 0; k < sparkles; k++) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * spread;
          ctx.globalAlpha = 0.25 + Math.random() * 0.6;
          ctx.fillStyle = Math.random() < 0.3 ? '#FFFFFF' : style.color;
          ctx.beginPath();
          ctx.arc(
            cx + Math.cos(angle) * radius,
            cy + Math.sin(angle) * radius,
            0.6 + Math.random() * (style.size / 9),
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      break;
    }

    case 'stamp': {
      // One stamp per `gap` of travel; the first segment always stamps.
      const gap = style.size * 1.15;
      if (style.travel > 0 && Math.floor(travel / gap) === Math.floor(style.travel / gap)) {
        return travel;
      }
      const glyph = STAMP_SHAPES[Math.floor(Math.random() * STAMP_SHAPES.length)];
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = style.color;
      ctx.font = `${style.size * 1.6}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.save();
      ctx.translate(to.x, to.y);
      ctx.rotate((Math.random() - 0.5) * 0.9);
      ctx.fillText(glyph, 0, 0);
      ctx.restore();
      break;
    }
  }

  return travel;
}

/** Single tap - draws a dot rather than a zero-length line. */
export function drawDot(ctx: CanvasRenderingContext2D, at: Point, style: StrokeStyle): void {
  drawSegment(ctx, { x: at.x - 0.01, y: at.y }, at, style);
}

/** Places an emoji sticker centred on a point. */
export function drawSticker(
  ctx: CanvasRenderingContext2D,
  at: Point,
  glyph: string,
  size: number,
  rotation = 0,
): void {
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui,sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.translate(at.x, at.y);
  ctx.rotate(rotation);
  ctx.fillText(glyph, 0, 0);
  ctx.restore();
}

export function defaultBrushSize(): number {
  return BRUSH_SIZES[2];
}

/* ------------------------------------------------------------------ */
/*  export                                                             */
/* ------------------------------------------------------------------ */

export interface ExportOptions {
  paint: HTMLCanvasElement;
  lines: HTMLCanvasElement;
  /** Multiplier on the working size; 2 gives a crisper share image. */
  scale?: number;
  watermark?: string | null;
}

/** Flattens paint + outlines onto white and returns a fresh canvas. */
export function flatten({ paint, lines, scale = 1, watermark }: ExportOptions): HTMLCanvasElement {
  const width = Math.round(paint.width * scale);
  const height = Math.round(paint.height * scale);

  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;

  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(paint, 0, 0, width, height);
  ctx.drawImage(lines, 0, 0, width, height);

  if (watermark) {
    const size = Math.max(12, Math.round(width * 0.022));
    ctx.font = `600 ${size}px system-ui, sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(43,33,64,0.38)';
    ctx.fillText(watermark, width - size, height - size * 0.6);
  }

  return out;
}

/** Fraction of fillable pixels that are no longer white - drives "finished?". */
export function coverage(
  ctx: CanvasRenderingContext2D,
  mask: Uint8Array,
  width: number,
  height: number,
): number {
  // Sample every 4th pixel in both directions; 16x cheaper, same answer.
  const step = 4;
  let fillable = 0;
  let painted = 0;

  const { data } = ctx.getImageData(0, 0, width, height);

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const p = y * width + x;
      if (mask[p]) continue;
      fillable++;
      const i = p * 4;
      if (data[i] < 246 || data[i + 1] < 246 || data[i + 2] < 246) painted++;
    }
  }

  return fillable === 0 ? 0 : painted / fillable;
}
