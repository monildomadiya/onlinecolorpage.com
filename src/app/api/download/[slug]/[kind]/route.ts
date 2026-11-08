import { type NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildKey, getObject, getObjectBuffer, putObject } from '@/lib/r2/client';
import { buildColoringPdf } from '@/lib/pdf';
import { getSettings } from '@/lib/settings';
import { recordEvent, requestContext } from '@/lib/track';
import { isR2Configured, isSupabaseConfigured, publicEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const maxDuration = 60;

type Kind = 'png' | 'pdf';

/**
 * Same rule as /api/file: a success here is cacheable for a day, so an error
 * that goes out without this header can be kept by a CDN for a day too, long
 * after whatever caused it is fixed.
 */
const NO_STORE = { 'Cache-Control': 'no-store' };

/**
 * Download endpoint for a published page.
 *
 *   /api/download/<slug>/png  -> the line-art master as an attachment
 *   /api/download/<slug>/pdf  -> the A4 printable, generated and cached on
 *                                first request if the admin never made one
 *
 * Also records the download so the admin dashboard and the card counters stay
 * honest.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; kind: string }> },
) {
  const { slug: rawSlug, kind: rawKind } = await params;
  const slug = decodeURIComponent(rawSlug);
  const kind = rawKind.toLowerCase() as Kind;

  if (kind !== 'png' && kind !== 'pdf') {
    return NextResponse.json({ error: 'Unknown download type.' }, { status: 400, headers: NO_STORE });
  }
  if (!isSupabaseConfigured || !isR2Configured) {
    return NextResponse.json({ error: 'Downloads are not configured yet.' }, { status: 503, headers: NO_STORE });
  }

  const supabase = createAdminClient();
  const { data: page } = await supabase
    .from('coloring_pages')
    .select('id, slug, title, image_key, pdf_key, allow_download, is_published')
    .eq('slug', slug)
    .maybeSingle();

  if (!page || !page.is_published) {
    return NextResponse.json({ error: 'Coloring page not found.' }, { status: 404, headers: NO_STORE });
  }
  if (!page.allow_download) {
    return NextResponse.json({ error: 'This page is view-only.' }, { status: 403, headers: NO_STORE });
  }

  const settings = await getSettings();
  if (!settings.features.allow_downloads) {
    return NextResponse.json({ error: 'Downloads are turned off.' }, { status: 403, headers: NO_STORE });
  }

  const context = requestContext(request);
  const filename = `${page.slug}-coloring-page.${kind}`;

  try {
    if (kind === 'png') {
      const object = await getObject(page.image_key);

      // Fire-and-forget: the browser should not wait on analytics.
      void recordEvent({ slug: page.slug, event: 'download_png', path: `/color/${page.slug}`, ...context });

      return new NextResponse(object.Body!.transformToWebStream(), {
        headers: {
          'Content-Type': object.ContentType ?? 'image/png',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    let pdfKey = page.pdf_key;

    if (!pdfKey) {
      const master = await getObjectBuffer(page.image_key);
      const pdf = await buildColoringPdf({
        png: master,
        title: page.title,
        siteName: settings.site.name,
        siteUrl: publicEnv.siteUrl.replace(/^https?:\/\//, ''),
      });

      pdfKey = buildKey('pdfs', page.slug, 'pdf');
      const stored = await putObject({ key: pdfKey, body: pdf, contentType: 'application/pdf' });

      await Promise.all([
        supabase.from('coloring_pages').update({ pdf_key: pdfKey }).eq('id', page.id),
        supabase.from('media').insert({
          key: pdfKey,
          kind: 'pdf',
          mime_type: 'application/pdf',
          size_bytes: stored.size,
          original_name: filename,
          page_id: page.id,
        }),
      ]);

      void recordEvent({ slug: page.slug, event: 'download_pdf', path: `/color/${page.slug}`, ...context });

      return new NextResponse(new Uint8Array(pdf), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    const object = await getObject(pdfKey);
    void recordEvent({ slug: page.slug, event: 'download_pdf', path: `/color/${page.slug}`, ...context });

    return new NextResponse(object.Body!.transformToWebStream(), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('[api/download] failed', slug, kind, error);
    return NextResponse.json({ error: 'Could not prepare that download.' }, { status: 500, headers: NO_STORE });
  }
}
