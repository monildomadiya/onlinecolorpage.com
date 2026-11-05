import Link from 'next/link';
import { ArrowRight, ChevronRight, ImageOff, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Section heading.
 *
 * One big chunky display word, centred, in the dark tone of whatever band the
 * section is painted in. No icon tile, no rule, no chrome - on a page built
 * from flat colour blocks the heading only has to name the block, and the
 * block already supplies the colour.
 *
 * `band` is still the section's hue, but it now drives the *text* colour
 * rather than a decorative underline.
 */
export function SectionHeading({
  title,
  subtitle,
  icon: Icon,
  band,
  href,
  linkLabel = 'See all',
  className,
}: {
  title: string;
  subtitle?: string;
  /** Kept for call-site compatibility; the flat design has no icon tile. */
  icon?: LucideIcon;
  /** Ink colour for the heading - normally the band's dark tone. */
  band?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
}) {
  void Icon;

  return (
    <div className={cn('mb-8 text-center', className)}>
      <h2
        className="band-title text-[2rem] leading-tight sm:text-[2.75rem]"
        style={band ? { color: band } : undefined}
      >
        {title}
      </h2>

      {subtitle && (
        <p className="mx-auto mt-3 max-w-xl text-sm text-ink-soft sm:text-base">{subtitle}</p>
      )}

      {href && (
        <Link
          href={href}
          className="group mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink underline decoration-ink/25 underline-offset-4 transition hover:decoration-ink"
        >
          {linkLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon = ImageOff,
  title,
  message,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-[var(--radius-card)] bg-white px-6 py-14 text-center shadow-[var(--shadow-card)]">
      <span
        aria-hidden
        className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-cream-deep text-ink-soft"
      >
        <Icon className="size-8" />
      </span>
      <h3 className="font-display text-xl text-ink">{title}</h3>
      {message && (
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">{message}</p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export function Chip({
  children,
  color = 'var(--color-mint)',
  className,
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-lg px-3 py-1 text-xs font-medium text-ink',
        className,
      )}
      style={{ background: color }}
    >
      {children}
    </span>
  );
}

/** Plain text breadcrumbs. */
export function Breadcrumbs({ trail }: { trail: { name: string; path: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="crumbs mb-7">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
        {trail.map((item, i) => (
          <li key={item.path} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-3.5 opacity-40" aria-hidden />}
            {i === trail.length - 1 ? (
              <span aria-current="page" className="truncate">
                {item.name}
              </span>
            ) : (
              <Link href={item.path}>{item.name}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
