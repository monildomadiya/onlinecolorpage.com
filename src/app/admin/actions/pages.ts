'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireStaff } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildKey, deleteObjects, getObjectBuffer, putObject } from '@/lib/r2/client';
import { buildColoringPdf } from '@/lib/pdf';
import { getSettings } from '@/lib/settings';
import { publicEnv } from '@/lib/env';
import { parseTags, slugify } from '@/lib/utils';

export interface ActionResult {
  ok: boolean;
  message: string;
}

const PageInput = z.object({
  id: z.string().uuid(),
  title: z.string().min(2, 'Title needs at least 2 characters.').max(160),
  slug: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  categoryId: z.string().uuid().nullable(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  ageMin: z.coerce.number().int().min(1).max(18),
  ageMax: z.coerce.number().int().min(1).max(18),
  tags: z.string().max(600).optional(),
  suggestedColors: z.string().max(600).optional(),
  isPublished: z.boolean(),
  isFeatured: z.boolean(),
  allowOnlineColor: z.boolean(),
  allowDownload: z.boolean(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(400).optional(),
});

function checkbox(form: FormData, name: string): boolean {
  const value = form.get(name);
  return value === 'on' || value === 'true' || value === '1';
}

function text(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

/** Saves the edit form. Slug changes are honoured but kept unique. */
export async function updatePageAction(
  _prev: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  await requireStaff('editor');

  const parsed = PageInput.safeParse({
    id: text(form, 'id'),
    title: text(form, 'title'),
    slug: slugify(text(form, 'slug') || text(form, 'title')),
    description: text(form, 'description'),
    categoryId: text(form, 'categoryId') || null,
    difficulty: text(form, 'difficulty') || 'easy',
    ageMin: text(form, 'ageMin') || '3',
    ageMax: text(form, 'ageMax') || '12',
    tags: text(form, 'tags'),
    suggestedColors: text(form, 'suggestedColors'),
    isPublished: checkbox(form, 'isPublished'),
    isFeatured: checkbox(form, 'isFeatured'),
    allowOnlineColor: checkbox(form, 'allowOnlineColor'),
    allowDownload: checkbox(form, 'allowDownload'),
    seoTitle: text(form, 'seoTitle'),
    seoDescription: text(form, 'seoDescription'),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Please check the form.' };
  }

  const input = parsed.data;
  if (input.ageMax < input.ageMin) {
    return { ok: false, message: 'Maximum age cannot be lower than minimum age.' };
  }

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from('coloring_pages')
    .select('id, slug')
    .eq('id', input.id)
    .maybeSingle();

  if (!existing) return { ok: false, message: 'That page no longer exists.' };

  // Another row already owns this slug?
  if (input.slug !== existing.slug) {
    const { data: clash } = await supabase
      .from('coloring_pages')
      .select('id')
      .eq('slug', input.slug)
      .neq('id', input.id)
      .maybeSingle();
    if (clash) return { ok: false, message: `The slug "${input.slug}" is already taken.` };
  }

  const colors = (input.suggestedColors ?? '')
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter((c) => /^#[0-9A-F]{6}$/.test(c))
    .slice(0, 16);

  const { error } = await supabase
    .from('coloring_pages')
    .update({
      title: input.title,
      slug: input.slug,
      description: input.description || null,
      category_id: input.categoryId,
      difficulty: input.difficulty,
      age_min: input.ageMin,
      age_max: input.ageMax,
      tags: parseTags(input.tags ?? ''),
      suggested_colors: colors,
      is_published: input.isPublished,
      is_featured: input.isFeatured,
      allow_online_color: input.allowOnlineColor,
      allow_download: input.allowDownload,
      seo_title: input.seoTitle || null,
      seo_description: input.seoDescription || null,
    })
    .eq('id', input.id);

  if (error) return { ok: false, message: error.message };

  revalidatePath('/');
  revalidatePath('/coloring-pages');
  revalidatePath(`/color/${existing.slug}`);
  if (input.slug !== existing.slug) revalidatePath(`/color/${input.slug}`);
  revalidatePath('/admin/pages');
  revalidatePath(`/admin/pages/${input.id}`);

  return { ok: true, message: 'Saved.' };
}

/** Deletes a page and every R2 object that belonged only to it. */
export async function deletePageAction(id: string): Promise<void> {
  await requireStaff('admin');

  const supabase = createAdminClient();
  const { data: page } = await supabase
    .from('coloring_pages')
    .select('id, slug, image_key, thumb_key, pdf_key, reference_key')
    .eq('id', id)
    .maybeSingle();

  if (!page) redirect('/admin/pages');

  const keys = [page.image_key, page.thumb_key, page.pdf_key, page.reference_key].filter(
    (k): k is string => Boolean(k),
  );

  // Storage first: an orphaned row is easier to spot than an orphaned object.
  try {
    await deleteObjects(keys);
  } catch (error) {
    console.warn('[pages] could not remove R2 objects for', page.slug, error);
  }

  await supabase.from('media').delete().in('key', keys);
  await supabase.from('coloring_pages').delete().eq('id', id);

  revalidatePath('/');
  revalidatePath('/coloring-pages');
  revalidatePath(`/color/${page.slug}`);
  revalidatePath('/admin/pages');

  redirect('/admin/pages?deleted=1');
}

export type BulkAction = 'publish' | 'unpublish' | 'feature' | 'unfeature' | 'delete';

/** Applies one action to a set of page ids from the list view. */
export async function bulkPagesAction(
  ids: string[],
  action: BulkAction,
): Promise<ActionResult> {
  const session = await requireStaff(action === 'delete' ? 'admin' : 'editor');
  if (ids.length === 0) return { ok: false, message: 'Nothing selected.' };

  const supabase = createAdminClient();

  if (action === 'delete') {
    const { data: pages } = await supabase
      .from('coloring_pages')
      .select('id, slug, image_key, thumb_key, pdf_key, reference_key')
      .in('id', ids);

    const keys = (pages ?? []).flatMap((page) =>
      [page.image_key, page.thumb_key, page.pdf_key, page.reference_key].filter(
        (k): k is string => Boolean(k),
      ),
    );

    try {
      await deleteObjects(keys);
    } catch (error) {
      console.warn('[pages] bulk R2 delete partially failed', error);
    }

    await supabase.from('media').delete().in('key', keys);
    const { error } = await supabase.from('coloring_pages').delete().in('id', ids);
    if (error) return { ok: false, message: error.message };

    for (const page of pages ?? []) revalidatePath(`/color/${page.slug}`);
    revalidatePath('/');
    revalidatePath('/coloring-pages');
    revalidatePath('/admin/pages');

    return { ok: true, message: `Deleted ${ids.length} page${ids.length === 1 ? '' : 's'}.` };
  }

  const patch = {
    publish: { is_published: true },
    unpublish: { is_published: false },
    feature: { is_featured: true },
    unfeature: { is_featured: false },
  }[action];

  const { error } = await supabase.from('coloring_pages').update(patch).in('id', ids);
  if (error) return { ok: false, message: error.message };

  revalidatePath('/');
  revalidatePath('/coloring-pages');
  revalidatePath('/admin/pages');

  const verb = {
    publish: 'Published',
    unpublish: 'Unpublished',
    feature: 'Featured',
    unfeature: 'Unfeatured',
  }[action];

  console.info(`[pages] ${session.email} ${action} on ${ids.length} page(s)`);
  return { ok: true, message: `${verb} ${ids.length} page${ids.length === 1 ? '' : 's'}.` };
}

/** Rebuilds the printable PDF from the stored master image. */
export async function regeneratePdfAction(id: string): Promise<ActionResult> {
  await requireStaff('editor');

  const supabase = createAdminClient();
  const { data: page } = await supabase
    .from('coloring_pages')
    .select('id, slug, title, image_key, pdf_key')
    .eq('id', id)
    .maybeSingle();

  if (!page) return { ok: false, message: 'Page not found.' };

  try {
    const settings = await getSettings();
    const master = await getObjectBuffer(page.image_key);

    const pdf = await buildColoringPdf({
      png: master,
      title: page.title,
      siteName: settings.site.name,
      siteUrl: publicEnv.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''),
    });

    const key = buildKey('pdfs', page.slug, 'pdf');
    const stored = await putObject({ key, body: pdf, contentType: 'application/pdf' });

    await supabase.from('coloring_pages').update({ pdf_key: key }).eq('id', page.id);
    await supabase.from('media').insert({
      key,
      kind: 'pdf',
      mime_type: 'application/pdf',
      size_bytes: stored.size,
      original_name: `${page.slug}.pdf`,
      page_id: page.id,
    });

    // Drop the previous PDF only once the new one is safely in place.
    if (page.pdf_key && page.pdf_key !== key) {
      await deleteObjects([page.pdf_key]);
      await supabase.from('media').delete().eq('key', page.pdf_key);
    }

    revalidatePath(`/color/${page.slug}`);
    revalidatePath(`/admin/pages/${page.id}`);

    return { ok: true, message: 'Printable PDF rebuilt.' };
  } catch (error) {
    console.error('[pages] PDF rebuild failed', error);
    return { ok: false, message: 'Could not rebuild the PDF. Check the server logs.' };
  }
}

/** Clears the guide image and its derived palette. */
export async function removeReferenceAction(id: string): Promise<ActionResult> {
  await requireStaff('editor');

  const supabase = createAdminClient();
  const { data: page } = await supabase
    .from('coloring_pages')
    .select('id, slug, reference_key')
    .eq('id', id)
    .maybeSingle();

  if (!page?.reference_key) return { ok: false, message: 'There is no guide image to remove.' };

  await deleteObjects([page.reference_key]);
  await supabase.from('media').delete().eq('key', page.reference_key);
  await supabase
    .from('coloring_pages')
    .update({ reference_key: null, suggested_colors: [] })
    .eq('id', page.id);

  revalidatePath(`/color/${page.slug}`);
  revalidatePath(`/admin/pages/${page.id}`);

  return { ok: true, message: 'Guide image removed.' };
}
