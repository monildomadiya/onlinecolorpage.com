'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export interface AdUnitProps {
  client: string;
  slotId: string;
  format?: string;
  fullWidthResponsive?: boolean;
  className?: string;
  /** Raw snippet, used only when we could not parse a slot id out of it. */
  rawHtml?: string;
  label?: boolean;
}

/**
 * Renders one AdSense unit.
 *
 * The loader script lives in the root layout, so all this has to do is drop an
 * <ins> in place and push once. React can mount effects twice in dev, hence the
 * `pushed` guard - pushing the same slot twice makes AdSense complain.
 */
export function AdUnit({
  client,
  slotId,
  format = 'auto',
  fullWidthResponsive = true,
  className,
  rawHtml,
  label = true,
}: AdUnitProps) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const rawRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rawHtml || pushed.current || !ref.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense blocked or not loaded - leave the space empty.
    }
  }, [rawHtml]);

  // Fallback path: inject the pasted snippet and run any <script> it carries,
  // because innerHTML alone never executes scripts.
  useEffect(() => {
    const host = rawRef.current;
    if (!rawHtml || !host || pushed.current) return;
    pushed.current = true;

    host.innerHTML = rawHtml;
    for (const old of Array.from(host.querySelectorAll('script'))) {
      const next = document.createElement('script');
      for (const attr of Array.from(old.attributes)) {
        next.setAttribute(attr.name, attr.value);
      }
      next.text = old.text;
      old.replaceWith(next);
    }
  }, [rawHtml]);

  const wrapper = cn('my-6 w-full overflow-hidden text-center', className);

  if (rawHtml) {
    return (
      <div className={wrapper} data-ad-wrapper>
        {label && <AdLabel />}
        <div ref={rawRef} />
      </div>
    );
  }

  return (
    <div className={wrapper} data-ad-wrapper>
      {label && <AdLabel />}
      <ins
        ref={ref}
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
      />
    </div>
  );
}

function AdLabel() {
  return (
    <span className="mb-1 block text-[10px] font-bold tracking-[0.18em] text-ink-soft/50 uppercase">
      Advertisement
    </span>
  );
}
