import { Breadcrumbs } from '@/components/ui/Section';
import { cn } from '@/lib/utils';

/** Shared shell for the static text pages (about, privacy, terms, contact). */
export function Prose({
  title,
  intro,
  trail,
  updated,
  children,
  className,
}: {
  title: string;
  intro?: string;
  trail: { name: string; path: string }[];
  updated?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 pb-16 sm:px-6">
      <Breadcrumbs trail={trail} />

      <header className="mb-8">
        <h1 className="band-title text-3xl text-ink sm:text-4xl">{title}</h1>
        {intro && <p className="mt-3 text-ink-soft">{intro}</p>}
        {updated && (
          <p className="mt-2 text-xs text-ink-soft/60">Last updated: {updated}</p>
        )}
      </header>

      <div
        className={cn(
          'glass space-y-5 p-6 text-[0.95rem] leading-[1.75] text-ink-soft sm:p-8 sm:text-base',
          '[&_h2]:mt-7 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-ink',
          '[&_h2:first-child]:mt-0',
          '[&_h3]:mt-5 [&_h3]:font-display [&_h3]:text-base [&_h3]:font-extrabold [&_h3]:text-ink',
          '[&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6',
          '[&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-6',
          '[&_a]:font-semibold [&_a]:text-coral [&_a]:underline [&_a]:underline-offset-2',
          '[&_strong]:font-semibold [&_strong]:text-ink',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
