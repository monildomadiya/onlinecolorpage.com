'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireStaff } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { deleteObjects } from '@/lib/r2/client';
import { publicUrl } from '@/lib/r2/public';
import { buildBookPdf } from '@/lib/books';
import { MAX_BOOK_PAGES } from '@/lib/pdf';
import { sanitizeRichText } from '@/lib/html';
import { slugify } from '@/lib/utils';
import type { PickerPage } from '@/lib/admin/queries';
import type { ActionResult } from './pages';

const BookInput = z.object({
  title: z.string().min(2, 'Give the book a title.').max(160),
  slug: z.string().min(2).max(120),
  subtitle: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  bodyHtml: z.string().max(120_000).optional(),
  includeCoverPage: z.boolean(),
  isPublished: z.boolean(),
  isFeatured: z.boolean(),
  allowDownload: z.boolean(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(400).optional(),
});

const UUID = z.string().uuid();

function checkbox(form: FormData, name: string): boolean {
  const value = form.get(name);
  return value === 'on' || value === 'true' || value === '1';
}

function text(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

/** The picker submits the chosen pages as one ordered, comma-separated list. */
function pageIds(form: FormData): string[] {
  return Array.from(
    new Set(
      text(form, 'pageIds')
        .split(',')
        .map((id) => id.trim())
        .filter((id) => UUID.safeParse(id).success),
    ),
  ).slice(0, MAX_BOOK_PAGES);
}

/** Appends -2, -3 … until the slug is free. */
async function uniqueBookSlug(base: string, ignoreId?: string): Promise<string> {
  const supabase = createAdminClient();
  const root = slugify(base) || 'coloring-book';

  for (let attempt = 0; attempt < 40; attempt++) {
    const candidate = attempt === 0 ? root : `${root}-${attempt + 1}`;
    const { data } = await supabase
      .from('books')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();
    if (!data || data.id === ignoreId) return candidate;
  }

  return `${root}-${Date.now().toString(36)}`;
}

function revalidateBook(slug: string, id?: string) {
  revalidatePath('/books');
  revalidatePath(`/book/${slug}`);
  revalidatePath('/admin/books');
  if (id) revalidatePath(`/admin/books/${id}`);
}

/* ------------------------------------------------------------------ */
/*  create / update / delete                                           */
/* ------------------------------------------------------------------ */

/** Creates the shell of a book, then hands over to the full editor. */
export async function createBookAction(
  _prev: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  await requireStaff('editor');

  const title = text(form, 'title');
  if (title.length < 2) return { ok: false, message: 'Give the book a title.' };

  const supabase = createAdminClient();
  const slug = await uniqueBookSlug(text(form, 'slug') || title);

  const { data, error } = await supabase
    .from('books')
    .insert({
      title,
      slug,
      subtitle: text(form, 'subtitle') || null,
      description: text(form, 'description') || null,
      body_html: sanitizeRichText(text(form, 'bodyHtml')),
      is_published: false,
    })
    .select('id, slug')
    .single();

  if (error || !data) {
    return { ok: false, message: error?.message ?? 'Could not create the book.' };
  }

  revalidateBook(data.slug, data.id);
  redirect(`/admin/books/${data.id}?created=1`);
}

/** Saves every field of the edit form, including the ordered page list. */
export async function updateBookAction(
  _prev: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  await requireStaff('editor');

  const id = text(form, 'id');
  if (!UUID.safeParse(id).success) return { ok: false, message: 'That book no longer exists.' };

  const parsed = BookInput.safeParse({
    title: text(form, 'title'),
    slug: slugify(text(form, 'slug') || text(form, 'title')),
    subtitle: text(form, 'subtitle'),
    description: text(form, 'description'),
    bodyHtml: text(form, 'bodyHtml'),
    includeCoverPage: checkbox(form, 'includeCoverPage'),
    isPublished: checkbox(form, 'isPublished'),
    isFeatured: checkbox(form, 'isFeatured'),
    allowDownload: checkbox(form, 'allowDownload'),
    seoTitle: text(form, 'seoTitle'),
    seoDescription: text(form, 'seoDescription'),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Please check the form.' };
  }

  const input = parsed.data;
  const chosen = pageIds(form);
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from('books')
    .select('id, slug, title, subtitle, include_cover_page, pdf_key')
    .eq('id', id)
    .maybeSingle();

  if (!existing) return { ok: false, message: 'That book no longer exists.' };

  if (input.isPublished && chosen.length === 0) {
    return { ok: false, message: 'A book needs at least one page before it can go live.' };
  }

  const slug = input.slug === existing.slug ? existing.slug : await uniqueBookSlug(input.slug, id);

  const { data: current } = await supabase
    .from('book_pages')
    .select('page_id, sort_order')
    .eq('book_id', id)
    .order('sort_order', { ascending: true });

  const before = (current ?? []).map((row) => row.page_id as string).join(',');
  const contentsChanged = before !== chosen.join(',');

  // Only the things the printed book is made of invalidate the cached PDF -
  // fixing a meta description should not throw away a 40-page build.
  const printChanged =
    contentsChanged ||
    input.title !== existing.title ||
    (input.subtitle || null) !== existing.subtitle ||
    input.includeCoverPage !== existing.include_cover_page;

  const { error } = await supabase
    .from('books')
    .update({
      title: input.title,
      slug,
      subtitle: input.subtitle || null,
      description: input.description || null,
      body_html: sanitizeRichText(input.bodyHtml),
      include_cover_page: input.includeCoverPage,
      is_published: input.isPublished,
      is_featured: input.isFeatured,
      allow_download: input.allowDownload,
      seo_title: input.seoTitle || null,
      seo_description: input.seoDescription || null,
      ...(printChanged ? { pdf_key: null, pdf_built_at: null, pdf_pages: null } : {}),
    })
    .eq('id', id);

  if (error) return { ok: false, message: error.message };

  if (contentsChanged) {
    // Replace wholesale: the list is short and a diff would only trade one
    // round trip for three.
    await supabase.from('book_pages').delete().eq('book_id', id);
    if (chosen.length > 0) {
      const { error: linkError } = await supabase.from('book_pages').insert(
        chosen.map((pageId, index) => ({ book_id: id, page_id: pageId, sort_order: index })),
      );
      if (linkError) return { ok: false, message: linkError.message };
    }
  }

  if (printChanged && existing.pdf_key) {
    try {
      await deleteObjects([existing.pdf_key]);
      await supabase.from('media').delete().eq('key', existing.pdf_key);
    } catch (cause) {
      console.warn('[books] could not drop the stale PDF', cause);
    }
  }

  revalidateBook(existing.slug, id);
  if (slug !== existing.slug) revalidatePath(`/book/${slug}`);

  return {
    ok: true,
    message: printChanged ? 'Saved. The printable book will rebuild on the next download.' : 'Saved.',
  };
}

/** Deletes a book, its PDF and its page links. The pages themselves stay. */
export async function deleteBookAction(id: string): Promise<void> {
  await requireStaff('admin');

  const supabase = createAdminClient();
  const { data: book } = await supabase
    .from('books')
    .select('id, slug, cover_key, pdf_key')
    .eq('id', id)
    .maybeSingle();

  if (!book) redirect('/admin/books');

  const keys = [book.cover_key, book.pdf_key].filter((k): k is string => Boolean(k));

  try {
    await deleteObjects(keys);
  } catch (error) {
    console.warn('[books] could not remove R2 objects for', book.slug, error);
  }

  await supabase.from('media').delete().in('key', keys);
  // book_pages goes with it: the foreign key cascades.
  await supabase.from('books').delete().eq('id', id);

  revalidateBook(book.slug, id);
  redirect('/admin/books?deleted=1');
}

/* ------------------------------------------------------------------ */
/*  the printable book                                                 */
/* ------------------------------------------------------------------ */

/** The admin's "Rebuild printable book" button. */
export async function rebuildBookPdfAction(id: string): Promise<ActionResult> {
  await requireStaff('editor');

  try {
    const built = await buildBookPdf(id);
    revalidatePath(`/admin/books/${id}`);
    return {
      ok: true,
      message: `Printable book rebuilt - ${built.pages} page${built.pages === 1 ? '' : 's'}.`,
    };
  } catch (error) {
    console.error('[books] PDF build failed', error);
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Could not build the book.',
    };
  }
}

/* ------------------------------------------------------------------ */
/*  the page picker                                                    */
/* ------------------------------------------------------------------ */

/** Search the library from inside the book editor. */
export async function searchPagesAction(
  query: string,
  categoryId?: string,
): Promise<PickerPage[]> {
  await requireStaff('editor');

  const supabase = createAdminClient();
  let builder = supabase
    .from('coloring_pages')
    .select('id, title, slug, thumb_key, image_key, is_published, category:categories ( name )')
    .order('created_at', { ascending: false })
    .limit(40);

  if (categoryId) builder = builder.eq('category_id', categoryId);

  const term = query.trim().replace(/[%,()]/g, ' ').slice(0, 80);
  if (term) builder = builder.or(`title.ilike.%${term}%,slug.ilike.%${term}%`);

  const { data, error } = await builder;
  if (error) {
    console.warn('[books] page search failed', error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const category = row.category as unknown as { name: string } | null;
    return {
      id: row.id as string,
      title: row.title as string,
      slug: row.slug as string,
      thumbUrl: publicUrl((row.thumb_key as string | null) ?? (row.image_key as string)),
      isPublished: Boolean(row.is_published),
      categoryName: category?.name ?? null,
    };
  });
}

/** "Add everything from this category", in the order the site lists them. */
export async function categoryPagesAction(categoryId: string): Promise<PickerPage[]> {
  await requireStaff('editor');

  const supabase = createAdminClient();
  const { data } = await supabase
    .from('coloring_pages')
    .select('id, title, slug, thumb_key, image_key, is_published, category:categories ( name )')
    .eq('category_id', categoryId)
    .eq('is_published', true)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(MAX_BOOK_PAGES);

  return (data ?? []).map((row) => {
    const category = row.category as unknown as { name: string } | null;
    return {
      id: row.id as string,
      title: row.title as string,
      slug: row.slug as string,
      thumbUrl: publicUrl((row.thumb_key as string | null) ?? (row.image_key as string)),
      isPublished: Boolean(row.is_published),
      categoryName: category?.name ?? null,
    };
  });
}
