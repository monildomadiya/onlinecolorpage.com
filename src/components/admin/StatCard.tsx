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
    violet: 'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    sky: 'bg-sky-50 text-sky-600',
    rose: 'bg-rose-50 text-rose-600',
    slate: 'bg-slate-100 text-slate-600',
  } as const;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold tracking-wide text-slate-500 uppercase">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-extrabold text-slate-900">{value}</p>
          {sub && <p className="mt-1 truncate text-xs font-semibold text-slate-400">{sub}</p>}
        </div>
        {icon && (
          <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', tones[tone])}>
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}
