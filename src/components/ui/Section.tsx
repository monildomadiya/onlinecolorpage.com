import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SectionHeading({
  title,
  subtitle,
  emoji,
  href,
  linkLabel = 'See all',
  className,
}: {
  title: string;
  subtitle?: string;
  emoji?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn('mb-5 flex flex-wrap items-end justify-between gap-3', className)}>
      <div>
        <h2 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">
          {emoji && (
            <span aria-hidden className="mr-2 inline-block animate-bob">
              {emoji}
            </span>
          )}
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm font-semibold text-ink-soft">{subtitle}</p>}
      </div>

      {href && (
        <Link
          href={href}
          className="group inline-flex items-center gap-1 rounded-xl bg-white px-4 py-2 font-display text-sm font-extrabold text-grape-700 shadow-[0_4px_0_var(--color-cream-deep)] transition hover:text-grape-900"
        >
          {linkLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}

export function EmptyState({
  emoji = '🎨',
  title,
  message,
  action,
}: {
  emoji?: string;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card-kid mx-auto max-w-lg px-6 py-12 text-center">
      <div aria-hidden className="mb-3 text-6xl animate-bob">
        {emoji}
      </div>
      <h3 className="font-display text-xl font-extrabold text-ink">{title}</h3>
      {message && <p className="mt-2 text-sm font-semibold text-ink-soft">{message}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Chip({
  children,
  color = '#8b4ff5',
  className,
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={cn('inline-flex rounded-full px-3 py-1 font-display text-xs font-extrabold', className)}
      style={{ background: `${color}1f`, color }}
    >
      {children}
    </span>
  );
}

export function Breadcrumbs({ trail }: { trail: { name: string; path: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-xs font-bold text-ink-soft">
      <ol className="flex flex-wrap items-center gap-1.5">
        {trail.map((item, i) => (
          <li key={item.path} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>/</span>}
            {i === trail.length - 1 ? (
              <span className="text-ink">{item.name}</span>
            ) : (
              <Link href={item.path} className="transition hover:text-grape-600">
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
