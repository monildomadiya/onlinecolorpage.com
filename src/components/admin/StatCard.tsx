import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = 'violet',
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  tone?: 'violet' | 'emerald' | 'amber' | 'sky' | 'rose' | 'slate';
}) {
  const tones = {
    violet: 'bg-grape-500 text-white',
    emerald: 'bg-emerald-500 text-white',
    amber: 'bg-amber-400 text-white',
    sky: 'bg-sky-500 text-white',
    rose: 'bg-rose-500 text-white',
    slate: 'bg-slate-500 text-white',
  } as const;

  return (
    <div className="rounded-[1.25rem] border border-ink/10 bg-white p-5 transition hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold tracking-wide text-slate-500 uppercase">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-extrabold text-slate-900">{value}</p>
          {sub && <p className="mt-1 truncate text-xs font-semibold text-slate-400">{sub}</p>}
        </div>
        {icon && (
          <span
            className={cn(
              'grid size-11 shrink-0 place-items-center rounded-2xl border border-ink/10',
              tones[tone],
            )}
          >
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}
