'use server';

import { revalidatePath } from 'next/cache';
import { requireStaff } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { deleteObjects } from '@/lib/r2/client';
import type { ActionResult } from './pages';

type SettingsSection = 'site' | 'home' | 'seo' | 'features' | 'ads';

const SECTIONS: Record<SettingsSection, { keys: string[]; booleans: string[]; numbers: string[] }> = {
  site: { keys: ['name', 'tagline', 'description', 'email'], booleans: [], numbers: [] },
  home: {
    keys: ['hero_title', 'hero_subtitle', 'hero_cta'],
    booleans: ['show_featured', 'show_popular', 'show_newest'],
    numbers: ['grid_size'],
  },
  seo: {
    keys: [
      'title_suffix',
      'default_title',
      'default_description',
      'twitter',
      'facebook',
      'instagram',
      'pinterest',
    ],
    booleans: [],
    numbers: [],
  },
  features: {
    keys: [],
    booleans: [
      'sounds_default_on',
      'confetti',
      'rewards',
      'guide_mode',
      'allow_downloads',
      'maintenance',
    ],
    numbers: [],
  },
  ads: { keys: ['client'], booleans: ['enabled'], numbers: [] },
};

function text(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function checkbox(form: FormData, name: string): boolean {
  const value = form.get(name);
  return value === 'on' || value === 'true' || value === '1';
}

/**
 * Saves one settings section.
 *
 * The allowed keys per section are declared above rather than taken from the
 * form, so a crafted request cannot inject arbitrary JSON into the row.
 */
export async function saveSettingsAction(
  _prev: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  await requireStaff('admin');

  const section = text(form, 'section') as SettingsSection;
  const schema = SECTIONS[section];
  if (!schema) return { ok: false, message: 'Unknown settings section.' };

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from('settings')
    .select('value')
    .eq('key', section)
    .maybeSingle();

  const value: Record<string, unknown> = { ...((existing?.value as object) ?? {}) };

  for (const key of schema.keys) {
    if (form.has(key)) value[key] = text(form, key);
  }
  for (const key of schema.booleans) {
    value[key] = checkbox(form, key);
  }
  for (const key of schema.numbers) {
    if (form.has(key)) {
      const parsed = Number.parseInt(text(form, key), 10);
      if (Number.isFinite(parsed)) value[key] = Math.max(4, Math.min(parsed, 96));
    }
  }

  const { error } = await supabase
    .from('settings')
    .upsert({ key: section, value }, { onConflict: 'key' });

  if (error) return { ok: false, message: error.message };

  // Settings drive the chrome on every page, so flush the whole tree.
  revalidatePath('/', 'layout');
  revalidatePath('/admin/settings');

  return { ok: true, message: 'Settings saved.' };
}

/** Saves one AdSense slot: the pasted snippet and whether it is live. */
export async function saveAdSlotAction(
  _prev: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  await requireStaff('admin');

  const slotKey = text(form, 'slotKey');
  if (!slotKey) return { ok: false, message: 'Missing slot key.' };

  const code = text(form, 'code');
  const isActive = checkbox(form, 'isActive');

  if (isActive && !code) {
    return { ok: false, message: 'Paste the ad code before switching this slot on.' };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('ad_slots')
    .update({ code: code || null, is_active: isActive })
    .eq('slot_key', slotKey);

  if (error) return { ok: false, message: error.message };

  revalidatePath('/', 'layout');
  revalidatePath('/admin/ads');

  return { ok: true, message: isActive ? 'Slot is live.' : 'Slot saved and switched off.' };
}

/** Removes a file from R2 and the media table. */
export async function deleteMediaAction(id: string): Promise<ActionResult> {
  await requireStaff('admin');

  const supabase = createAdminClient();
  const { data: item } = await supabase.from('media').select('*').eq('id', id).maybeSingle();

  if (!item) return { ok: false, message: 'File not found.' };

  // Refuse while a coloring page still points at this key.
  const { data: inUse } = await supabase
    .from('coloring_pages')
    .select('id, title')
    .or(
      `image_key.eq.${item.key},thumb_key.eq.${item.key},pdf_key.eq.${item.key},reference_key.eq.${item.key}`,
    )
    .maybeSingle();

  if (inUse) {
    return {
      ok: false,
      message: `Still used by "${inUse.title}". Delete or re-upload that page first.`,
    };
  }

  try {
    await deleteObjects([item.key as string]);
  } catch (error) {
    console.warn('[media] R2 delete failed', error);
  }

  await supabase.from('media').delete().eq('id', id);
  revalidatePath('/admin/media');

  return { ok: true, message: 'File deleted.' };
}

/** Promotes or demotes a staff account. Admin-only, and cannot demote yourself. */
export async function setRoleAction(
  userId: string,
  role: 'admin' | 'editor' | 'viewer',
): Promise<ActionResult> {
  const session = await requireStaff('admin');

  if (userId === session.userId && role !== 'admin') {
    return { ok: false, message: 'You cannot remove your own admin access.' };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);

  if (error) return { ok: false, message: error.message };

  revalidatePath('/admin/users');
  return { ok: true, message: `Role set to ${role}.` };
}
