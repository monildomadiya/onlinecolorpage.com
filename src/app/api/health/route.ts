import { NextResponse } from 'next/server';
import { isR2Configured, isSupabaseConfigured } from '@/lib/env';

export const dynamic = 'force-dynamic';

/** Liveness probe for the Docker HEALTHCHECK and Azure App Service. */
export function GET() {
  return NextResponse.json(
    {
      ok: true,
      uptime: Math.round(process.uptime()),
      supabase: isSupabaseConfigured,
      r2: isR2Configured,
      time: new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
