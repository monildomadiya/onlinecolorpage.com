import { createAdminClient } from '@/lib/supabase/admin';
import { buildKey, deleteObjects, getObjectBuffer, putObject } from '@/lib/r2/client';
import { buildColoringBook, MAX_BOOK_PAGES } from '@/lib/pdf';
import { toPngBuffer } from '@/lib/images';
import { getSettings } from '@/lib/settings';
import { publicEnv } from '@/lib/env';

export interface BuiltBook {
  key: string;
  pages: number;
  size: number;
  /** The bytes that were just stored, so a caller can serve them directly. */
  pdf: Buffer;
}

/**
 * Builds a book's multi-page PDF and stores it on the row.
 *
 * Deliberately not a server action: the admin's "Rebuild" button and the
 * public download route both call it, each behind its own guard, and an
 * exported `'use server'` function would be a third, unguarded way in.
 *
 * Whoever asks for a book first after an edit pays for the build; everybody
 * after that is served the stored file.
 */
export async function buildBookPdf(bookId: string): Promise<BuiltBook> {
  const supabase = createAdminClient();

  const { data: book } = await supabase
    .from('books')
    .select('id, slug, title, subtitle, cover_key, pdf_key, include_cover_page')
    .eq('id', bookId)
    .maybeSingle();

  if (!book) throw new Error('Book not found.');

  const { data: links } = await supabase
    .from('book_pages')
    .select('page_id, sort_order')
    .eq('book_id', book.id)
    .order('sort_order', { ascending: true });

  const ordered = (links ?? []).map((row) => row.page_id as string);
  if (ordered.length === 0) throw new Error('This book has no pages yet.');

  const { data: pages } = await supabase
    .from('coloring_pages')
    .select('id, title, image_key, is_published')
    .in('id', ordered);

  const byId = new Map((pages ?? []).map((page) => [page.id as string, page]));
  const printable = ordered
    .map((id) => byId.get(id))
    .filter((page): page is NonNullable<typeof page> => Boolean(page?.is_published))
    .slice(0, MAX_BOOK_PAGES);

  if (printable.length === 0) {
    throw new Error('None of this book’s pages are published yet.');
  }

  const settings = await getSettings();

  // Sequential on purpose: every master stays in memory until save(), so
  // fetching them all at once only moves the peak earlier.
  const drawings: { png: Buffer; title: string }[] = [];
  for (const page of printable) {
    drawings.push({ png: await getObjectBuffer(page.image_key), title: page.title });
  }

  let cover: Buffer | null = null;
  if (book.cover_key && book.include_cover_page) {
    try {
      // Covers are stored as WebP, which pdf-lib cannot embed.
      cover = await toPngBuffer(await getObjectBuffer(book.cover_key));
    } catch (error) {
      console.warn('[books] cover image unavailable for', book.slug, error);
    }
  }

  const pdf = await buildColoringBook(drawings, {
    title: book.title,
    subtitle: book.subtitle,
    cover,
    includeCoverPage: book.include_cover_page,
    siteName: settings.site.name,
    siteUrl: publicEnv.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''),
  });

  const key = buildKey('pdfs', `${book.slug}-coloring-book`, 'pdf');
  const stored = await putObject({ key, body: pdf, contentType: 'application/pdf' });

  await supabase
    .from('books')
    .update({ pdf_key: key, pdf_built_at: new Date().toISOString(), pdf_pages: printable.length })
    .eq('id', book.id);

  await supabase.from('media').insert({
    key,
    kind: 'pdf',
    mime_type: 'application/pdf',
    size_bytes: stored.size,
    original_name: `${book.slug}-coloring-book.pdf`,
  });

  // Only now that the new file is live is the old one safe to drop.
  if (book.pdf_key && book.pdf_key !== key) {
    try {
      await deleteObjects([book.pdf_key]);
      await supabase.from('media').delete().eq('key', book.pdf_key);
    } catch (error) {
      console.warn('[books] could not remove the previous PDF', error);
    }
  }

  return { key, pages: printable.length, size: stored.size, pdf };
}
