import { getAdSlots, getSettings } from '@/lib/settings';
import { AdUnit } from './AdUnit';

export type SlotKey = 'header' | 'grid_inline' | 'sidebar' | 'below_canvas' | 'page_bottom';

/** Pulls `data-ad-client` / `data-ad-slot` / `data-ad-format` out of a pasted snippet. */
function parseSnippet(code: string) {
  const attr = (name: string) => code.match(new RegExp(`${name}=["']([^"']+)["']`))?.[1] ?? '';

  const slotFromAttr = attr('data-ad-slot');
  // Admin may have pasted only the numeric slot id.
  const bareDigits = /^\s*\d{6,}\s*$/.test(code) ? code.trim() : '';

  return {
    client: attr('data-ad-client'),
    slotId: slotFromAttr || bareDigits,
    format: attr('data-ad-format') || 'auto',
  };
}

/**
 * Server component. Renders the ad configured for `slot` in the admin panel,
 * or nothing at all when ads are off / the slot is empty - so the layout never
 * reserves dead space.
 */
export async function AdSlot({
  slot,
  className,
  label = true,
}: {
  slot: SlotKey;
  className?: string;
  label?: boolean;
}) {
  const [settings, slots] = await Promise.all([getSettings(), getAdSlots()]);

  if (!settings.ads.enabled) return null;

  const row = slots[slot];
  if (!row?.is_active || !row.code?.trim()) return null;

  const parsed = parseSnippet(row.code);
  const client = parsed.client || settings.ads.client;

  if (!client) return null;

  // No slot id found -> fall back to injecting the snippet verbatim.
  if (!parsed.slotId) {
    return <AdUnit client={client} slotId="" rawHtml={row.code} className={className} label={label} />;
  }

  return (
    <AdUnit
      client={client}
      slotId={parsed.slotId}
      format={parsed.format}
      className={className}
      label={label}
    />
  );
}
