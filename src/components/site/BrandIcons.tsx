/**
 * Simple geometric social glyphs.
 *
 * lucide-react dropped its brand icons in v1, and these are drawn here as
 * plain shapes so the footer needs no extra icon dependency.
 */

type Props = { className?: string };

const BASE = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export function FacebookIcon({ className }: Props) {
  return (
    <svg {...BASE} className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <path d="M15 8h-1.5a2 2 0 0 0-2 2V21M9.5 13.5h5" />
    </svg>
  );
}

export function InstagramIcon({ className }: Props) {
  return (
    <svg {...BASE} className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5.5" />
      <circle cx="12" cy="12" r="3.75" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function XIcon({ className }: Props) {
  return (
    <svg {...BASE} className={className}>
      <path d="M4.5 4.5 19.5 19.5M19.5 4.5 4.5 19.5" />
    </svg>
  );
}

export function PinterestIcon({ className }: Props) {
  return (
    <svg {...BASE} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M10.5 18.5 12.2 11M9.8 11.6h3.1a2.4 2.4 0 0 0 0-4.8H10.6" />
    </svg>
  );
}
