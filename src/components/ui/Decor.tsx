import { cn } from '@/lib/utils';

/**
 * Local colour orbs for a hero or a feature panel.
 *
 * The page already carries a fixed aurora behind everything (see globals.css);
 * these sit closer to the content so a single section can be lit a little
 * warmer than the rest. Purely decorative, hidden from assistive tech.
 */
export function Blobs({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <div className="absolute -top-28 -left-24 size-80 rounded-full bg-grape-400/35 blur-[90px] animate-float" />
      <div
        className="absolute top-6 -right-24 size-96 rounded-full bg-sky/30 blur-[100px] animate-float"
        style={{ animationDelay: '1.6s' }}
      />
      <div
        className="absolute -bottom-32 left-1/3 size-80 rounded-full bg-coral/25 blur-[90px] animate-float"
        style={{ animationDelay: '3.1s' }}
      />
    </div>
  );
}

/**
 * A thin luminous ring, used to frame a focal element on glass.
 * Reads as a lens flare caught on the edge of a pane.
 */
export function GlowRing({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 rounded-[inherit]',
        'bg-[conic-gradient(from_180deg,rgb(139_79_245_/_0.5),rgb(56_189_248_/_0.45),rgb(255_107_129_/_0.4),rgb(255_200_61_/_0.45),rgb(139_79_245_/_0.5))]',
        'opacity-60 blur-[18px]',
        className,
      )}
    />
  );
}

/**
 * The brand mark: a single crayon, drawn flat so it stays legible at 20px.
 * Takes its colour from the text colour of whatever it sits in, which is what
 * lets one mark serve the glass header and the dark admin shell.
 */
export function CrayonMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none">
      <path
        d="M9 2.5h6l1.6 4.2v12.6a2.2 2.2 0 0 1-2.2 2.2H9.6a2.2 2.2 0 0 1-2.2-2.2V6.7L9 2.5Z"
        fill="currentColor"
        opacity="0.25"
      />
      <path
        d="M9 2.5h6l1.6 4.2v12.6a2.2 2.2 0 0 1-2.2 2.2H9.6a2.2 2.2 0 0 1-2.2-2.2V6.7L9 2.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M7.4 10.2h9.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 5v2.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

/** The site mascot: a waving crayon. Drawn inline so it costs no request. */
export function CrayonMascot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 170" className={className} role="img" aria-label="Smiling crayon mascot">
      <defs>
        <linearGradient id="crayonBody" x1="26" y1="46" x2="94" y2="150">
          <stop offset="0" stopColor="#a274fc" />
          <stop offset="1" stopColor="#7c2fe8" />
        </linearGradient>
        <linearGradient id="shine" x1="26" y1="46" x2="94" y2="150">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.42" />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="tip" x1="28" y1="4" x2="92" y2="48">
          <stop offset="0" stopColor="#ffd76b" />
          <stop offset="1" stopColor="#ff8a3d" />
        </linearGradient>
      </defs>

      {/* body */}
      <rect x="26" y="46" width="68" height="104" rx="20" fill="url(#crayonBody)" />
      <rect x="26" y="46" width="68" height="104" rx="20" fill="url(#shine)" />
      {/* wrapper bands */}
      <rect x="26" y="66" width="68" height="8" fill="#ffffff" opacity="0.7" />
      <rect x="26" y="124" width="68" height="8" fill="#ffffff" opacity="0.7" />
      {/* tip */}
      <path d="M60 4 L92 48 H28 Z" fill="url(#tip)" />
      <path d="M60 4 L76 26 H44 Z" fill="#ff6b81" opacity="0.9" />
      {/* face */}
      <circle cx="47" cy="96" r="6" fill="#241a3d" />
      <circle cx="73" cy="96" r="6" fill="#241a3d" />
      <circle cx="49" cy="94" r="2.1" fill="#fff" />
      <circle cx="75" cy="94" r="2.1" fill="#fff" />
      <path
        d="M46 110 q14 13 28 0"
        stroke="#241a3d"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="34" cy="107" r="5" fill="#ff6b81" opacity="0.5" />
      <circle cx="86" cy="107" r="5" fill="#ff6b81" opacity="0.5" />
      {/* waving arm */}
      <g
        className="origin-[20px_120px] animate-wiggle"
        style={{ animationIterationCount: 'infinite', animationDuration: '2.2s' }}
      >
        <path
          d="M26 120 q-16 -6 -18 -22"
          stroke="#8b4ff5"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="7" cy="96" r="8" fill="#8b4ff5" />
      </g>
    </svg>
  );
}

/** Wavy divider between sections. */
export function WaveDivider({
  className,
  fill = '#ffffff',
  flip = false,
}: {
  className?: string;
  fill?: string;
  flip?: boolean;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 90"
      preserveAspectRatio="none"
      className={cn('block w-full', flip && 'rotate-180', className)}
    >
      <path d="M0 42c180-40 320 36 520 22s300-58 480-30 260 44 440 20v36H0z" fill={fill} />
    </svg>
  );
}

/** Floating glints for hero and celebration states. */
export function Sparkles({ className }: { className?: string }) {
  const dots = [
    { x: '8%', y: '18%', c: '#ffc83d', s: 10, d: '0s' },
    { x: '22%', y: '70%', c: '#ff6b81', s: 7, d: '0.5s' },
    { x: '44%', y: '12%', c: '#38bdf8', s: 9, d: '1s' },
    { x: '63%', y: '64%', c: '#34d399', s: 6, d: '1.4s' },
    { x: '82%', y: '26%', c: '#f472b6', s: 9, d: '0.8s' },
    { x: '93%', y: '72%', c: '#a3e635', s: 7, d: '1.9s' },
  ];

  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0', className)}>
      {dots.map((dot, i) => (
        <span
          key={i}
          className="absolute block rounded-full animate-bob"
          style={{
            left: dot.x,
            top: dot.y,
            width: dot.s,
            height: dot.s,
            background: dot.c,
            boxShadow: `0 0 ${dot.s * 2}px ${dot.c}`,
            animationDelay: dot.d,
          }}
        />
      ))}
    </div>
  );
}
