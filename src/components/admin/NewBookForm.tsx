'use client';

import { useActionState, useState } from 'react';
import { BookPlus } from 'lucide-react';
import { createBookAction } from '@/app/admin/actions/books';
import type { ActionResult } from '@/app/admin/actions/pages';
import { AdminButton, Alert, Card, Field, Input, Textarea } from './ui';
import { slugify } from '@/lib/utils';

const INITIAL: ActionResult = { ok: false, message: '' };

/**
 * Creates the shell of a book. Pages, cover, the long description and the SEO
 * fields all live on the editor the action redirects to - the same two-step
 * shape as uploading a coloring page.
 */
export function NewBookForm() {
  const [state, formAction, saving] = useActionState(createBookAction, INITIAL);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);

  return (
    <form action={formAction} className="space-y-5">
      {state.message && <Alert tone={state.ok ? 'success' : 'error'}>{state.message}</Alert>}

      <Card title="The basics">
        <div className="grid gap-4">
          <Field label="Title" htmlFor="title" required>
            <Input
              id="title"
              name="title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (!slugTouched) setSlug(slugify(event.target.value));
              }}
              placeholder="Jungle Animals Coloring Book"
              required
              maxLength={160}
            />
          </Field>

          <Field
            label="URL slug"
            htmlFor="slug"
            hint={slug ? `/book/${slug}` : 'Generated from the title'}
          >
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(slugify(event.target.value));
              }}
              placeholder="jungle-animals-coloring-book"
              maxLength={120}
            />
          </Field>

          <Field label="Subtitle" htmlFor="subtitle" hint="Printed under the title on the cover page.">
            <Input
              id="subtitle"
              name="subtitle"
              placeholder="20 friendly animals to colour and print"
              maxLength={200}
            />
          </Field>

          <Field
            label="Short description"
            htmlFor="description"
            hint="One or two lines. Used on cards and as the fallback meta description."
          >
            <Textarea id="description" name="description" rows={3} maxLength={2000} />
          </Field>
        </div>
      </Card>

      <div className="flex justify-end">
        <AdminButton type="submit" loading={saving}>
          {!saving && <BookPlus className="size-4" aria-hidden />}
          Create book
        </AdminButton>
      </div>
    </form>
  );
}
