'use client';

import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { signInAction, type LoginState } from '@/app/admin/actions/auth';
import { AdminButton, Alert, Field, Input } from './ui';

const INITIAL: LoginState = { error: null };

export function LoginForm() {
  const params = useSearchParams();
  const [state, formAction, pending] = useActionState(signInAction, INITIAL);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={params.get('next') ?? '/admin'} />

      {state.error && <Alert tone="error">{state.error}</Alert>}

      <Field label="Email" htmlFor="email" required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
      </Field>

      <Field label="Password" htmlFor="password" required>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </Field>

      <AdminButton type="submit" loading={pending} className="w-full">
        {!pending && <LogIn className="size-4" aria-hidden />}
        Sign in
      </AdminButton>
    </form>
  );
}
