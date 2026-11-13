/**
 * URL helpers for R2 object keys. Safe to import from client components -
 * nothing here touches server-only env vars.
 */

/** Percent-encodes each path segment but keeps the `/` separators. */
export function encodeKey(key: string): string {
  return key
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/');
}

/**
 * Bump this by hand when a bad response has been cached under the current
 * /api/file URLs.
 *
 * It exists because of one: next.config.ts used to stamp
 * `immutable, max-age=31536000` on every response from that path, errors
 * included, so the route's own "Storage is not configured." 503 went out
 * looking like a line-art PNG that never expires. Cloudflare kept it, and so
 * did the browser of everyone who opened a coloring page that week.
 *
 * The config is fixed and errors now say no-store, but neither reaches a copy
 * already sitting in someone's browser, and `immutable` means it will not even
 * revalidate. A different URL is the only way past it.
 *
 * 1 -> 2: the 503 above, cached 2026-11-05 to 2026-11-08.
 */
const CACHE_EPOCH = '2';

/**
 * Same-origin URL that streams the object through our own server.
 *
 * Always use this for anything the <canvas> must read pixels from: a
 * cross-origin image taints the canvas and breaks flood fill / PNG export.
 */
export function fileUrl(key: string | null | undefined): string {
  if (!key) return '';
  return `/api/file/${encodeKey(key)}?v=${CACHE_EPOCH}`;
}

/**
 * Public URL for display-only assets (thumbnails, OG images, covers).
 * Falls back to the same-origin proxy when no R2 public base is configured.
 */
export function cdnUrl(key: string | null | undefined, publicBase?: string): string {
  if (!key) return '';
  const base = (publicBase ?? '').replace(/\/+$/, '');
  return base ? `${base}/${encodeKey(key)}` : fileUrl(key);
}

/** Attachment download URL (sets Content-Disposition and records the event). */
export function downloadUrl(slug: string, kind: 'png' | 'pdf'): string {
  return `/api/download/${encodeURIComponent(slug)}/${kind}`;
}

/** The multi-page PDF for a coloring book, built on first request. */
export function bookPdfUrl(slug: string): string {
  return `/api/book/${encodeURIComponent(slug)}/pdf`;
}
