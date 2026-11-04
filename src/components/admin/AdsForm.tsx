'use client';

import { useActionState, useState } from 'react';
import { Save } from 'lucide-react';
import { saveAdSlotAction, saveSettingsAction } from '@/app/admin/actions/settings';
import type { ActionResult } from '@/app/admin/actions/pages';
import { AdminButton, Alert, Badge, Card, Field, Input, Textarea, Toggle } from './ui';
import type { AdSlot, AdsSettings } from '@/types/db';

const INITIAL: ActionResult = { ok: false, message: '' };

const SLOT_HELP: Record<string, string> = {
  header: 'A wide banner directly under the navigation bar.',
  grid_inline: 'Appears between rows in a coloring-page grid.',
  sidebar: 'The rail beside listings on wide screens.',
  below_canvas: 'Under the coloring canvas - the highest-attention spot.',
  page_bottom: 'Above the footer at the end of a page.',
};

export function AdsSettingsForm({
  ads,
  envClient,
}: {
  ads: AdsSettings;
  envClient: string;
}) {
  const [state, formAction, saving] = useActionState(saveSettingsAction, INITIAL);
  const [enabled, setEnabled] = useState(ads.enabled);

  return (
    <Card
      title="AdSense account"
      description="Your publisher ID and the master on/off switch for every slot."
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="section" value="ads" />
        <input type="hidden" name="enabled" value={String(enabled)} />

        {state.message && (
          <Alert tone={state.ok ? 'success' : 'error'}>{state.message}</Alert>
        )}

        {envClient && (
          <Alert tone="info">
            <code>NEXT_PUBLIC_ADSENSE_CLIENT</code> is set to <strong>{envClient}</strong> in the
            environment, which always wins over the value below.
          </Alert>
        )}

        <Field
          label="Publisher ID"
          htmlFor="ads-client"
          hint="Looks like ca-pub-1234567890123456. Found in AdSense under Account → Settings."
        >
          <Input
            id="ads-client"
            name="client"
            defaultValue={ads.client}
            placeholder="ca-pub-XXXXXXXXXXXXXXXX"
            maxLength={40}
          />
        </Field>

        <Toggle
          checked={enabled}
          onChange={setEnabled}
          label="Show ads on the site"
          hint="Off hides every slot instantly, whatever each slot's own switch says."
        />

        <div className="flex justify-end">
          <AdminButton type="submit" loading={saving}>
            {!saving && <Save className="size-4" aria-hidden />}
            Save
          </AdminButton>
        </div>
      </form>
    </Card>
  );
}

export function AdSlotForm({ slot }: { slot: AdSlot }) {
  const [state, formAction, saving] = useActionState(saveAdSlotAction, INITIAL);
  const [active, setActive] = useState(slot.is_active);

  return (
    <Card
      title={slot.name}
      description={SLOT_HELP[slot.slot_key] ?? slot.slot_key}
      action={<Badge tone={slot.is_active ? 'green' : 'slate'}>{slot.is_active ? 'Live' : 'Off'}</Badge>}
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="slotKey" value={slot.slot_key} />
        <input type="hidden" name="isActive" value={String(active)} />

        {state.message && (
          <Alert tone={state.ok ? 'success' : 'error'}>{state.message}</Alert>
        )}

        <Field
          label="Ad unit code"
          htmlFor={`code-${slot.slot_key}`}
          hint="Paste the whole snippet from AdSense, or just the numeric slot ID."
        >
          <Textarea
            id={`code-${slot.slot_key}`}
            name="code"
            defaultValue={slot.code ?? ''}
            rows={5}
            className="font-mono text-xs"
            placeholder={'<ins class="adsbygoogle" data-ad-client="ca-pub-…" data-ad-slot="1234567890" data-ad-format="auto"></ins>'}
          />
        </Field>

        <Toggle checked={active} onChange={setActive} label="Enable this slot" />

        <div className="flex justify-end">
          <AdminButton type="submit" loading={saving}>
            {!saving && <Save className="size-4" aria-hidden />}
            Save slot
          </AdminButton>
        </div>
      </form>
    </Card>
  );
}
