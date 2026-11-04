'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/env';

export interface LoginState {
  error: string | null;
}

const Credentials = z.object({
  email: z.string().email('That does not look like an email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  next: z.string().optional(),
});

/** Email + password sign-in for staff. Used with useActionState. */
export async function signInAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!isSupabaseConfigured) {
    return { error: 'Supabase is not configured yet. Add the env vars and restart.' };
  }

  const parsed = Credentials.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the form.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Deliberately vague: do not confirm whether an address exists.
    return { error: 'Wrong email or password. Please try again.' };
  }

  // Only allow redirects back into our own admin area.
  const target =
    parsed.data.next && parsed.data.next.startsWith('/admin') ? parsed.data.next : '/admin';

  revalidatePath('/admin', 'layout');
  redirect(target);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/admin', 'layout');
  redirect('/admin/login');
}
