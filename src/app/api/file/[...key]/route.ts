import { type NextRequest, NextResponse } from 'next/server';
import { getObject } from '@/lib/r2/client';
import { isR2Configured } from '@/lib/env';

export const runtime = 'nodejs';

/**
 * Errors from this route must never be stored by a cache.
 *
 * A success here is served `immutable, max-age=1y`, and the path ends in the
 * object's own extension, so a CDN in front of us treats it as a static image
 * and caches by status as well as body. Without this header a momentary 503 -
 * one deploy with the R2 variables not yet set, say - is kept at the edge for
 * a year, and every visitor keeps getting it long after the server is healthy
 * again. That is not hypothetical: it is what put "Storage is not configured."
 * in front of the coloring canvas on the live site.
 */
const NO_STORE = { 'Cache-Control': 'no-store' };

/**
 * Streams an R2 object through our own origin.
 *
 * Why this exists even when a public CDN base is configured: the coloring
 * canvas has to call getImageData() on the line art, and a cross-origin image
 * taints the canvas. Serving the master image from the same origin sidesteps
 * CORS entirely.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  if (!isR2Configured) {
    return NextResponse.json(
      { error: 'Storage is not configured.' },
      { status: 503, headers: NO_STORE },
    );
  }

  const { key: segments } = await params;
  const key = segments.map(decodeURIComponent).join('/');

  if (!key || key.includes('..') || key.startsWith('/')) {
    return NextResponse.json({ error: 'Bad key.' }, { status: 400, headers: NO_STORE });
  }

  try {
    const object = await getObject(key);

    const etag = object.ETag ?? undefined;
    if (etag && request.headers.get('if-none-match') === etag) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag } });
    }

    const headers = new Headers({
      'Content-Type': object.ContentType ?? 'application/octet-stream',
      'Cache-Control': object.CacheControl ?? 'public, max-age=31536000, immutable',
      // Same-origin by definition, but be explicit for canvas reads.
      'Access-Control-Allow-Origin': '*',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      // The canvas asks for this image in CORS mode, so the request carries an
      // Origin and a cache in front of us may key on it. Saying so stops the
      // CORS and plain copies standing in for one another.
      Vary: 'Origin',
    });
    if (etag) headers.set('ETag', etag);
    if (object.ContentLength) headers.set('Content-Length', String(object.ContentLength));
    if (object.LastModified) headers.set('Last-Modified', object.LastModified.toUTCString());

    return new NextResponse(object.Body!.transformToWebStream(), { status: 200, headers });
  } catch (error) {
    const name = (error as { name?: string })?.name;
    if (name === 'NoSuchKey' || name === 'NotFound') {
      return NextResponse.json({ error: 'Not found.' }, { status: 404, headers: NO_STORE });
    }
    console.error('[api/file] failed to read', key, error);
    return NextResponse.json(
      { error: 'Could not read the file.' },
      { status: 500, headers: NO_STORE },
    );
  }
}
