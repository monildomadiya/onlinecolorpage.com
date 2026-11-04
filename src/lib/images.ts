import sharp from 'sharp';

/** Formats we accept for the line-art master. */
export const ACCEPTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/svg+xml',
] as const;

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB

export interface ProcessedArtwork {
  /** Normalised line-art master: PNG, white background, max 2000px. */
  master: { buffer: Buffer; contentType: 'image/png'; ext: 'png'; width: number; height: number };
  /** 600px-wide WebP for grids and cards. */
  thumb: { buffer: Buffer; contentType: 'image/webp'; ext: 'webp' };
}

/**
 * Turns whatever the admin uploaded into the two derivatives the site needs.
 *
 * Line art is flattened onto white (so transparent PNGs do not render as black
 * on dark mode) and capped at 2000px, which keeps the canvas responsive on
 * phones while staying sharp enough for an A4 print.
 */
export async function processArtwork(input: Buffer): Promise<ProcessedArtwork> {
  // `density` only matters for SVG input, where it sets the rasterisation DPI.
  const base = sharp(input, { density: 220, failOn: 'none' });
  const meta = await base.metadata();

  const masterBuffer = await base
    .clone()
    .rotate() // honour EXIF orientation
    .resize({
      width: 2000,
      height: 2000,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .flatten({ background: '#ffffff' })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();

  const masterMeta = await sharp(masterBuffer).metadata();

  const thumbBuffer = await sharp(masterBuffer)
    .resize({ width: 600, height: 600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  return {
    master: {
      buffer: masterBuffer,
      contentType: 'image/png',
      ext: 'png',
      width: masterMeta.width ?? meta.width ?? 0,
      height: masterMeta.height ?? meta.height ?? 0,
    },
    thumb: { buffer: thumbBuffer, contentType: 'image/webp', ext: 'webp' },
  };
}

/** Smaller WebP used for category covers and the site logo. */
export async function processCover(input: Buffer, width = 800): Promise<Buffer> {
  return sharp(input, { density: 220, failOn: 'none' })
    .rotate()
    .resize({ width, height: width, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
}

/**
 * Picks a handful of dominant colours from a reference (already-coloured)
 * image, which the coloring game offers as the "suggested palette".
 */
export async function suggestPalette(input: Buffer, count = 8): Promise<string[]> {
  const size = 48;
  const { data } = await sharp(input, { failOn: 'none' })
    .resize(size, size, { fit: 'inside' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Bucket into a coarse 5x5x5 RGB cube and keep the busiest buckets.
  const buckets = new Map<number, { count: number; r: number; g: number; b: number }>();

  for (let i = 0; i < data.length; i += 3) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Skip near-white and near-black - that is paper and line art.
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max > 238 || max < 28 || max - min < 12) continue;

    const id = Math.floor(r / 52) * 25 + Math.floor(g / 52) * 5 + Math.floor(b / 52);
    const bucket = buckets.get(id) ?? { count: 0, r: 0, g: 0, b: 0 };
    bucket.count += 1;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(id, bucket);
  }

  return Array.from(buckets.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, count)
    .map(({ count: n, r, g, b }) => {
      const hex = (v: number) =>
        Math.round(v / n)
          .toString(16)
          .padStart(2, '0');
      return `#${hex(r)}${hex(g)}${hex(b)}`.toUpperCase();
    });
}
