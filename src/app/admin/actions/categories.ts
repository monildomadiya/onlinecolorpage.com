'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireStaff } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { deleteObjects } from '@/lib/r2/client';
import { slugify } from '@/lib/utils';
import type { ActionResult } from './pages';

const CategoryInput = z.object({
  id: z.string().uuid().optional().nullable(),
  name: z.string().min(2, 'Name needs at least 2 characters.').max(80),
  slug: z.string().min(2).max(80),
  description: z.string().max(600).optional(),
  emoji: z.string().max(12).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Colour must be a hex value like #8B5CF6.')
    .optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  isActive: z.boolean(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(400).optional(),
});

function text(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function checkbox(form: FormData, name: string): boolean {
  const value = form.get(name);
  return value === 'on' || value === 'true' || value === '1';
}

/** Creates a category when `id` is empty, otherwise updates it. */
export async function saveCategoryAction(
  _prev: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  await requireStaff('editor');

  const parsed = CategoryInput.safeParse({
    id: text(form, 'id') || null,
    name: text(form, 'name'),
    slug: slugify(text(form, 'slug') || text(form, 'name')),
    description: text(form, 'description'),
    emoji: text(form, 'emoji') || '🎨',
    color: text(form, 'color') || '#8B5CF6',
    sortOrder: text(form, 'sortOrder') || '0',
    isActive: checkbox(form, 'isActive'),
    seoTitle: text(form, 'seoTitle'),
    seoDescription: text(form, 'seoDescription'),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Please check the form.' };
  }

  const input = parsed.data;
  const supabase = createAdminClient();

  const { data: clash } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', input.slug)
    .maybeSingle();

  if (clash && clash.id !== input.id) {
    return { ok: false, message: `The slug "${input.slug}" is already in use.` };
  }

  const row = {
    name: input.name,
    slug: input.slug,
    description: input.description || null,
    emoji: input.emoji || '🎨',
    color: input.color || '#8B5CF6',
    sort_order: input.sortOrder,
    is_active: input.isActive,
    seo_title: input.seoTitle || null,
    seo_description: input.seoDescription || null,
  };

  const { error } = input.id
    ? await supabase.from('categories').update(row).eq('id', input.id)
    : await supabase.from('categories').insert(row);

  if (error) return { ok: false, message: error.message };

  revalidatePath('/');
  revalidatePath('/categories');
  revalidatePath(`/category/${input.slug}`);
  revalidatePath('/admin/categories');

  return { ok: true, message: input.id ? 'Category saved.' : `Created "${input.name}".` };
}

/**
 * Deletes a category. Pages keep existing - the schema sets their category_id
 * to null - so nothing is silently lost.
 */
export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  await requireStaff('admin');

  const supabase = createAdminClient();
  const { data: category } = await supabase
    .from('categories')
    .select('id, slug, name, cover_key')
    .eq('id', id)
    .maybeSingle();

  if (!category) return { ok: false, message: 'Category not found.' };

  const { count } = await supabase
    .from('coloring_pages')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id);

  if (category.cover_key) {
    try {
      await deleteObjects([category.cover_key]);
      await supabase.from('media').delete().eq('key', category.cover_key);
    } catch (error) {
      console.warn('[categories] cover delete failed', error);
    }
  }

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) return { ok: false, message: error.message };

  revalidatePath('/');
  revalidatePath('/categories');
  revalidatePath(`/category/${category.slug}`);
  revalidatePath('/admin/categories');

  const moved = count ?? 0;
  return {
    ok: true,
    message: moved
      ? `Deleted "${category.name}". ${moved} page${moved === 1 ? '' : 's'} are now uncategorised.`
      : `Deleted "${category.name}".`,
  };
}

/** Persists a drag-reordered list in one round trip. */
export async function reorderCategoriesAction(orderedIds: string[]): Promise<ActionResult> {
  await requireStaff('editor');

  const supabase = createAdminClient();

  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('categories').update({ sort_order: index + 1 }).eq('id', id),
    ),
  );

  revalidatePath('/');
  revalidatePath('/categories');
  revalidatePath('/admin/categories');

  return { ok: true, message: 'Order saved.' };
}
