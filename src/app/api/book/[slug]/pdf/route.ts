import { type NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getObject } from '@/lib/r2/client';
import { buildBookPdf } from '@/lib/books';
import { getSettings } from '@/lib/settings';
import { isR2Configured, isSupabaseConfigured } from '@/lib/env';

export const runtime = 'nodejs';
// A sixty-page book is sixty images to fetch, scale and embed; the single-page
// route's minute is not enough headroom for that.
export const maxDuration = 120;

/**
 * Same rule as /api/download: a success here is cacheable for a day, so an
 * error that goes out without this header can be kept by a CDN for a day too,
 * long after whatever caused it is fixed.
 */
const NO_STORE = { 'Cache-Control': 'no-store' };

/**
 * Downloads a coloring book as one multi-page PDF.
 *
 *   /api/book/<slug>/pdf
 *
 * The file is built once and stored on the book row, so only the first
 * visitor after an edit waits for it. Editing a book clears that cache, which
 * is what keeps the download honest about the book's current contents.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);

  if (!isSupabaseConfigured || !isR2Configured) {
    return NextResponse.json(
      { error: 'Downloads are not configured yet.' },
      { status: 503, headers: NO_STORE },
    );
  }

  const supabase = createAdminClient();
  const { data: book } = await supabase
    .from('books')
    .select('id, slug, title, pdf_key, allow_download, is_published')
    .eq('slug', slug)
    .maybeSingle();

  if (!book || !book.is_published) {
    return NextResponse.json(
      { error: 'Coloring book not found.' },
      { status: 404, headers: NO_STORE },
    );
  }
  if (!book.allow_download) {
    return NextResponse.json(
      { error: 'This book is view-only.' },
      { status: 403, headers: NO_STORE },
    );
  }

  const settings = await getSettings();
  if (!settings.features.allow_downloads) {
    return NextResponse.json(
      { error: 'Downloads are turned off.' },
      { status: 403, headers: NO_STORE },
    );
  }

  const filename = `${book.slug}-coloring-book.pdf`;
  // Fire-and-forget: the browser should not wait on a counter.
  const count = () => {
    void supabase.rpc('track_book_download', { p_slug: book.slug }).then(undefined, (error) => {
      console.warn('[api/book] download not counted', error);
    });
  };

  try {
    if (book.pdf_key) {
      const object = await getObject(book.pdf_key);
      count();

      return new NextResponse(object.Body!.transformToWebStream(), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // Nothing cached: build it now and hand back the bytes we just stored,
    // rather than reading them straight back out of R2.
    const built = await buildBookPdf(book.id);
    count();

    return new NextResponse(new Uint8Array(built.pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('[api/book] failed', slug, error);
    return NextResponse.json(
      { error: 'Could not prepare that coloring book.' },
      { status: 500, headers: NO_STORE },
    );
  }
}
