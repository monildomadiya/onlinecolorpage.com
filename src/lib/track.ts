import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/env';
import type { Device, EventType } from '@/types/db';

export interface TrackInput {
  slug: string;
  event: EventType;
  path?: string | null;
  referrer?: string | null;
  country?: string | null;
  device?: Device | null;
}

/** Rough device class from the UA string - enough for a dashboard split. */
export function deviceFromUserAgent(ua: string | null | undefined): Device {
  if (!ua) return 'unknown';
  const s = ua.toLowerCase();
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(s)) return 'tablet';
  if (/mobi|iphone|ipod|android|blackberry|opera mini|iemobile/.test(s)) return 'mobile';
  return 'desktop';
}

/**
 * Records one analytics event. Never throws and never blocks the response -
 * a missing row is worth far less than a served page.
 */
export async function recordEvent(input: TrackInput): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    const supabase = createAdminClient();
    await supabase.rpc('track_event', {
      p_slug: input.slug,
      p_event: input.event,
      p_path: input.path ?? null,
      p_referrer: input.referrer ?? null,
      p_country: input.country ?? null,
      p_device: input.device ?? 'unknown',
    });
  } catch (error) {
    console.warn('[track] skipped event', input.event, error);
  }
}

/** Pulls the useful request context out of the headers Azure / Cloudflare set. */
export function requestContext(request: Request) {
  const headers = request.headers;
  return {
    referrer: headers.get('referer'),
    country:
      headers.get('cf-ipcountry') ??
      headers.get('x-vercel-ip-country') ??
      headers.get('x-client-country') ??
      null,
    device: deviceFromUserAgent(headers.get('user-agent')),
  };
}
