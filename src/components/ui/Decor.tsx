import { cn } from '@/lib/utils';

/**
 * Soft blurred colour blobs for hero / section backgrounds.
 * Purely decorative, hidden from assistive tech.
 */
export function Blobs({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-sunny/45 blur-3xl animate-float" />
      <div
        className="absolute top-10 right-[-6rem] h-80 w-80 rounded-full bg-sky/40 blur-3xl animate-float"
        style={{ animationDelay: '1.6s' }}
      />
      <div
        className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-coral/35 blur-3xl animate-float"
        style={{ animationDelay: '3.1s' }}
      />
    </div>
  );
}

/** The site mascot: a waving crayon. Drawn inline so it costs no request. */
export function CrayonMascot({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 170"
      className={className}
      role="img"
      aria-label="Smiling crayon mascot"
    >
      {/* body */}
      <rect x="26" y="46" width="68" height="104" rx="16" fill="#8b4ff5" />
      <rect x="26" y="46" width="68" height="104" rx="16" fill="url(#shine)" />
      {/* wrapper bands */}
      <rect x="26" y="66" width="68" height="9" fill="#ffffff" opacity="0.85" />
      <rect x="26" y="124" width="68" height="9" fill="#ffffff" opacity="0.85" />
      {/* tip */}
      <path d="M60 4 L92 48 H28 Z" fill="#ffc83d" />
      <path d="M60 4 L76 26 H44 Z" fill="#ff8a3d" />
      {/* face */}
      <circle cx="47" cy="96" r="6" fill="#2b2140" />
      <circle cx="73" cy="96" r="6" fill="#2b2140" />
      <circle cx="49" cy="94" r="2" fill="#fff" />
      <circle cx="75" cy="94" r="2" fill="#fff" />
      <path
        d="M46 110 q14 13 28 0"
        stroke="#2b2140"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="34" cy="107" r="5" fill="#ff6b81" opacity="0.5" />
      <circle cx="86" cy="107" r="5" fill="#ff6b81" opacity="0.5" />
      {/* waving arm */}
      <g className="origin-[20px_120px] animate-wiggle" style={{ animationIterationCount: 'infinite', animationDuration: '2.2s' }}>
        <path
          d="M26 120 q-16 -6 -18 -22"
          stroke="#8b4ff5"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="7" cy="96" r="8" fill="#8b4ff5" />
      </g>
      <defs>
        <linearGradient id="shine" x1="26" y1="46" x2="94" y2="150">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
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
      <path
        d="M0 42c180-40 320 36 520 22s300-58 480-30 260 44 440 20v36H0z"
        fill={fill}
      />
    </svg>
  );
}

/** Confetti-ish floating shapes for celebration states. */
export function Sparkles({ className }: { className?: string }) {
  const dots = [
    { x: '8%', y: '18%', c: '#ffc83d', s: 14, d: '0s' },
    { x: '22%', y: '70%', c: '#ff6b81', s: 10, d: '0.5s' },
    { x: '44%', y: '12%', c: '#38bdf8', s: 12, d: '1s' },
    { x: '63%', y: '64%', c: '#34d399', s: 9, d: '1.4s' },
    { x: '82%', y: '26%', c: '#f472b6', s: 13, d: '0.8s' },
    { x: '93%', y: '72%', c: '#a3e635', s: 10, d: '1.9s' },
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
            animationDelay: dot.d,
          }}
        />
      ))}
    </div>
  );
}
