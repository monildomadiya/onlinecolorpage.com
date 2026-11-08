import Link from 'next/link';
import { ArrowRight, ChevronRight, ImageOff, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Section heading.
 *
 * A small uppercase pill naming the section, then one heavy display line with
 * a crayon swoosh under it, then the subtitle. The "see all" link is a white
 * capsule rather than an underlined word, so it reads as the same family of
 * object as every other control on the page.
 *
 * `band` tints the swoosh. The heading itself stays ink: on a page where every
 * section is a white panel on peach, a coloured heading would be the only
 * thing shouting.
 */
export function SectionHeading({
  title,
  subtitle,
  icon: Icon,
  band,
  eyebrow,
  href,
  linkLabel = 'See all',
  align = 'center',
  className,
}: {
  title: string;
  subtitle?: string;
  /** Kept for call-site compatibility; the flat design has no icon tile. */
  icon?: LucideIcon;
  /** Accent for the swoosh under the title - normally the section's hue. */
  band?: string;
  /** Small uppercase label above the title. */
  eyebrow?: string;
  href?: string;
  linkLabel?: string;
  align?: 'center' | 'left';
  className?: string;
}) {
  void Icon;

  const centred = align === 'center';

  return (
    <div className={cn('mb-8', centred ? 'text-center' : 'text-left', className)}>
      {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}

      <h2 className="band-title text-[1.9rem] leading-tight sm:text-[2.6rem]">
        <span className="swoosh" style={band ? { ['--swoosh' as string]: band } : undefined}>
          {title}
        </span>
      </h2>

      {subtitle && (
        <p
          className={cn(
            'mt-4 max-w-xl text-sm text-ink-soft sm:text-base',
            centred && 'mx-auto',
          )}
        >
          {subtitle}
        </p>
      )}

      {href && (
        <Link
          href={href}
          className="btn-kid btn-ghost group mt-5 px-5 py-2.5 text-sm"
        >
          {linkLabel}
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
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
    <div className="panel mx-auto max-w-lg px-6 py-14 text-center">
      <span
        aria-hidden
        className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-cream text-coral"
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
        'inline-flex rounded-full px-3 py-1 text-xs font-semibold text-ink',
        className,
      )}
      style={{ background: `color-mix(in srgb, ${color} 28%, white)` }}
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
