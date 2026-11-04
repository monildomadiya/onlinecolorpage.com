'use client';

import { useEffect, useRef } from 'react';

/**
 * Records one `view` per page load. Fires after mount so it never delays
 * first paint, and de-dupes per session so a re-render does not double count.
 */
export function ViewTracker({ slug }: { slug: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;

    const key = `ocp:viewed:${slug}`;
    try {
      // One view per slug per browser session keeps the numbers meaningful.
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // Private mode - fall through and count it.
    }

    const timer = setTimeout(() => {
      void fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, event: 'view', path: `/color/${slug}` }),
        keepalive: true,
      }).catch(() => {});
    }, 1200);

    return () => clearTimeout(timer);
  }, [slug]);

  return null;
}
