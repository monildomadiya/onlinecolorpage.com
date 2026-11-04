import { type NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { assertStaff, AuthError } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildKey, putObject } from '@/lib/r2/client';
import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_BYTES, processArtwork, processCover, suggestPalette } from '@/lib/images';
import { buildColoringPdf } from '@/lib/pdf';
import { getSettings } from '@/lib/settings';
import { isR2Configured, publicEnv } from '@/lib/env';
import { parseTags, slugify, titleFromFilename } from '@/lib/utils';
import type { Difficulty } from '@/types/db';

export const runtime = 'nodejs';
export const maxDuration = 120;

type Mode = 'page' | 'reference' | 'cover' | 'pdf';

/** Appends -2, -3 … until the slug is free. */
async function uniqueSlug(base: string): Promise<string> {
  const supabase = createAdminClient();
  const root = slugify(base) || 'coloring-page';

  for (let attempt = 0; attempt < 40; attempt++) {
    const candidate = attempt === 0 ? root : `${root}-${attempt + 1}`;
    const { data } = await supabase
      .from('coloring_pages')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();
    if (!data) return candidate;
  }

  return `${root}-${Date.now().toString(36)}`;
}

function field(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function bool(form: FormData, name: string, fallback = false): boolean {
  const value = field(form, name);
  return value === '' ? fallback : value === 'true' || value === '1' || value === 'on';
}

/**
 * One endpoint for every admin file upload.
 *
 *   mode=page       new coloring page: normalises the art, makes a 600px webp
 *                   thumbnail and (optionally) an A4 print PDF, then inserts
 *                   the row
 *   mode=reference  pre-coloured guide image for an existing page; also derives
 *                   a suggested palette from it
 *   mode=cover      category cover image
 *   mode=pdf        replace a page's printable PDF with a hand-made one
 */
export async function POST(request: NextRequest) {
  try {
    const session = await assertStaff('editor');

    if (!isR2Configured) {
      return NextResponse.json(
        { error: 'Cloudflare R2 is not configured. Add the R2_* environment variables.' },
        { status: 503 },
      );
    }

    const form = await request.formData();
    const file = form.get('file');

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'No file was received.' }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `"${file.name}" is larger than ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.` },
        { status: 413 },
      );
    }

    const mode = (field(form, 'mode') || 'page') as Mode;
    const supabase = createAdminClient();
    const input = Buffer.from(await file.arrayBuffer());

    /* ---------------------------- pdf ---------------------------- */
    if (mode === 'pdf') {
      const pageId = field(form, 'pageId');
      if (!pageId) return NextResponse.json({ error: 'pageId is required.' }, { status: 400 });
      if (file.type !== 'application/pdf') {
        return NextResponse.json({ error: 'That file is not a PDF.' }, { status: 415 });
      }

      const { data: page } = await supabase
        .from('coloring_pages')
        .select('id, slug')
        .eq('id', pageId)
        .maybeSingle();
      if (!page) return NextResponse.json({ error: 'Page not found.' }, { status: 404 });

      const key = buildKey('pdfs', page.slug, 'pdf');
      const stored = await putObject({ key, body: input, contentType: 'application/pdf' });

      await Promise.all([
        supabase.from('coloring_pages').update({ pdf_key: key }).eq('id', page.id),
        supabase.from('media').insert({
          key,
          kind: 'pdf',
          mime_type: 'application/pdf',
          size_bytes: stored.size,
          original_name: file.name,
          page_id: page.id,
          uploaded_by: session.userId,
        }),
      ]);

      revalidatePath(`/color/${page.slug}`);
      return NextResponse.json({ ok: true, key });
    }

    /* --------------------- image-based modes --------------------- */
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
      return NextResponse.json(
        { error: `"${file.name}" is a ${file.type || 'unknown'} file. Use PNG, JPG, WebP or SVG.` },
        { status: 415 },
      );
    }

    if (mode === 'cover') {
      const categoryId = field(form, 'categoryId');
      if (!categoryId) {
        return NextResponse.json({ error: 'categoryId is required.' }, { status: 400 });
      }

      const { data: category } = await supabase
        .from('categories')
        .select('id, slug')
        .eq('id', categoryId)
        .maybeSingle();
      if (!category) return NextResponse.json({ error: 'Category not found.' }, { status: 404 });

      const webp = await processCover(input, 1000);
      const key = buildKey('covers', category.slug, 'webp');
      const stored = await putObject({ key, body: webp, contentType: 'image/webp' });

      await Promise.all([
        supabase.from('categories').update({ cover_key: key }).eq('id', category.id),
        supabase.from('media').insert({
          key,
          kind: 'image',
          mime_type: 'image/webp',
          size_bytes: stored.size,
          original_name: file.name,
          uploaded_by: session.userId,
        }),
      ]);

      revalidatePath('/categories');
      revalidatePath(`/category/${category.slug}`);
      return NextResponse.json({ ok: true, key });
    }

    if (mode === 'reference') {
      const pageId = field(form, 'pageId');
      if (!pageId) return NextResponse.json({ error: 'pageId is required.' }, { status: 400 });

      const { data: page } = await supabase
        .from('coloring_pages')
        .select('id, slug')
        .eq('id', pageId)
        .maybeSingle();
      if (!page) return NextResponse.json({ error: 'Page not found.' }, { status: 404 });

      const webp = await processCover(input, 1200);
      const palette = await suggestPalette(input, 10);

      const key = buildKey('refs', page.slug, 'webp');
      const stored = await putObject({ key, body: webp, contentType: 'image/webp' });

      await Promise.all([
        supabase
          .from('coloring_pages')
          .update({ reference_key: key, suggested_colors: palette })
          .eq('id', page.id),
        supabase.from('media').insert({
          key,
          kind: 'image',
          mime_type: 'image/webp',
          size_bytes: stored.size,
          original_name: file.name,
          page_id: page.id,
          uploaded_by: session.userId,
        }),
      ]);

      revalidatePath(`/color/${page.slug}`);
      return NextResponse.json({ ok: true, key, suggested_colors: palette });
    }

    /* ---------------------- mode = page ---------------------- */
    const title = field(form, 'title') || titleFromFilename(file.name);
    const slug = await uniqueSlug(field(form, 'slug') || title);

    const artwork = await processArtwork(input);
    const settings = await getSettings();

    const imageKey = buildKey('pages', slug, artwork.master.ext);
    const thumbKey = buildKey('thumbs', slug, artwork.thumb.ext);

    const [masterStored, thumbStored] = await Promise.all([
      putObject({
        key: imageKey,
        body: artwork.master.buffer,
        contentType: artwork.master.contentType,
        metadata: { slug },
      }),
      putObject({
        key: thumbKey,
        body: artwork.thumb.buffer,
        contentType: artwork.thumb.contentType,
      }),
    ]);

    // Printable PDF, generated unless the admin opted out.
    let pdfKey: string | null = null;
    let pdfSize = 0;
    if (bool(form, 'generatePdf', true)) {
      try {
        const pdf = await buildColoringPdf({
          png: artwork.master.buffer,
          title,
          siteName: settings.site.name,
          siteUrl: publicEnv.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''),
        });
        pdfKey = buildKey('pdfs', slug, 'pdf');
        const stored = await putObject({ key: pdfKey, body: pdf, contentType: 'application/pdf' });
        pdfSize = stored.size;
      } catch (cause) {
        // A failed PDF must not lose the upload - the download route can retry.
        console.warn('[upload] PDF generation failed for', slug, cause);
        pdfKey = null;
      }
    }

    const categoryId = field(form, 'categoryId');
    const difficulty = (field(form, 'difficulty') || 'easy') as Difficulty;
    const ageMin = Number.parseInt(field(form, 'ageMin') || '3', 10);
    const ageMax = Number.parseInt(field(form, 'ageMax') || '12', 10);

    const { data: page, error } = await supabase
      .from('coloring_pages')
      .insert({
        slug,
        title,
        description: field(form, 'description') || null,
        category_id: categoryId || null,
        image_key: imageKey,
        thumb_key: thumbKey,
        pdf_key: pdfKey,
        width: artwork.master.width,
        height: artwork.master.height,
        file_size: masterStored.size,
        difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'easy',
        age_min: Number.isFinite(ageMin) ? Math.max(1, Math.min(ageMin, 18)) : 3,
        age_max: Number.isFinite(ageMax) ? Math.max(1, Math.min(ageMax, 18)) : 12,
        tags: parseTags(field(form, 'tags')),
        is_published: bool(form, 'publish', true),
        is_featured: bool(form, 'featured', false),
        seo_title: field(form, 'seoTitle') || null,
        seo_description: field(form, 'seoDescription') || null,
      })
      .select('id, slug, title, is_published')
      .single();

    if (error || !page) {
      console.error('[upload] insert failed', error);
      return NextResponse.json(
        { error: error?.message ?? 'Could not save the page.' },
        { status: 500 },
      );
    }

    await supabase.from('media').insert([
      {
        key: imageKey,
        kind: 'image' as const,
        mime_type: artwork.master.contentType,
        size_bytes: masterStored.size,
        width: artwork.master.width,
        height: artwork.master.height,
        original_name: file.name,
        page_id: page.id,
        uploaded_by: session.userId,
      },
      {
        key: thumbKey,
        kind: 'thumb' as const,
        mime_type: artwork.thumb.contentType,
        size_bytes: thumbStored.size,
        original_name: file.name,
        page_id: page.id,
        uploaded_by: session.userId,
      },
      ...(pdfKey
        ? [
            {
              key: pdfKey,
              kind: 'pdf' as const,
              mime_type: 'application/pdf',
              size_bytes: pdfSize,
              original_name: `${slug}.pdf`,
              page_id: page.id,
              uploaded_by: session.userId,
            },
          ]
        : []),
    ]);

    revalidatePath('/');
    revalidatePath('/coloring-pages');
    if (categoryId) revalidatePath('/categories');

    return NextResponse.json({
      ok: true,
      page: { id: page.id, slug: page.slug, title: page.title, published: page.is_published },
      pdf: Boolean(pdfKey),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[upload] unexpected failure', error);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}
