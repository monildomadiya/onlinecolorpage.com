import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { recordEvent, requestContext } from '@/lib/track';

export const runtime = 'nodejs';

const Body = z.object({
  slug: z.string().min(1).max(120),
  event: z.enum(['view', 'print', 'color_start', 'color_finish', 'like']),
  path: z.string().max(500).optional(),
});

/**
 * Client-side event beacon. Downloads are tracked server-side in the download
 * route instead, so this only accepts the events the browser alone can see.
 */
export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = Body.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await recordEvent({
    slug: parsed.data.slug,
    event: parsed.data.event,
    path: parsed.data.path ?? null,
    ...requestContext(request),
  });

  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
