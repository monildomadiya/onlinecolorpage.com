import { cdnUrl } from './urls';

/**
 * CDN URL for an R2 key, for server components that only need to *display* a
 * file. Kept separate from `./client` so rendering a card does not pull the
 * whole AWS SDK into the module graph.
 */
export function publicUrl(key: string | null | undefined): string {
  const base = (process.env.R2_PUBLIC_BASE_URL ?? '').replace(/\/+$/, '');
  return cdnUrl(key, base);
}
