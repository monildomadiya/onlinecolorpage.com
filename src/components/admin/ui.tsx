'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* form controls */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-bold text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
    </div>
  );
}

const CONTROL =
  'w-full rounded-2xl border border-slate-300/80 bg-white px-3.5 py-2.5 text-sm text-slate-900 ' +
  'shadow-[inset_0_1px_2px_rgb(15_23_42_/_0.04)] ' +
  'placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none ' +
  'disabled:bg-slate-50 disabled:text-slate-500';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(CONTROL, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(CONTROL, 'min-h-24 resize-y', props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(CONTROL, 'pr-8', props.className)} />;
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition',
        checked
          ? 'border-violet-300/70 bg-violet-50/70'
          : 'border-ink/10 bg-white hover:bg-cream-deep',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition',
          checked ? 'bg-grape-600' : 'bg-slate-300',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-5 rounded-full bg-white shadow transition-all',
            checked ? 'left-[1.375rem]' : 'left-0.5',
          )}
        />
      </button>
      <span>
        <span className="block text-sm font-bold text-slate-800">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>}
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* buttons */
/* ------------------------------------------------------------------ */

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary:
    'border border-ink/10 bg-grape-600 text-white hover:-translate-y-0.5 hover: focus-visible:outline-violet-600',
  secondary:
    'border border-ink/10 bg-white text-slate-700 hover:-translate-y-0.5 hover:bg-cream-deep',
  danger: 'border border-ink/10 bg-rose-600 text-white hover:-translate-y-0.5',
  ghost: 'text-slate-600 hover:bg-cream-deep',
};

export function AdminButton({
  variant = 'primary',
  loading,
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-200',
        'disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50',
        VARIANTS[variant],
        className,
      )}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* layout bits */
/* ------------------------------------------------------------------ */

export function Card({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-[1.25rem] border border-ink/10 bg-white', className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-ink/10 px-5 py-4">
          <div>
            {title && <h2 className="text-base font-extrabold text-slate-900">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Badge({
  children,
  tone = 'slate',
}: {
  children: React.ReactNode;
  tone?: 'slate' | 'green' | 'amber' | 'rose' | 'violet' | 'sky';
}) {
  const tones = {
    slate: 'border-slate-300/60 bg-slate-100/80 text-slate-700',
    green: 'border-emerald-300/60 bg-emerald-100/80 text-emerald-700',
    amber: 'border-amber-300/60 bg-amber-100/80 text-amber-700',
    rose: 'border-rose-300/60 bg-rose-100/80 text-rose-700',
    violet: 'border-violet-300/60 bg-violet-100/80 text-violet-700',
    sky: 'border-sky-300/60 bg-sky-100/80 text-sky-700',
  } as const;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold whitespace-nowrap',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Alert({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'success' | 'error' | 'warning';
  children: React.ReactNode;
}) {
  const tones = {
    info: 'border-sky-300/60 bg-sky-50/80 text-sky-900',
    success: 'border-emerald-300/60 bg-emerald-50/80 text-emerald-900',
    error: 'border-rose-300/60 bg-rose-50/80 text-rose-900',
    warning: 'border-amber-300/60 bg-amber-50/80 text-amber-900',
  } as const;

  return (
    <div
      className={cn('rounded-2xl border px-4 py-3 text-sm font-semibold', tones[tone])}
      role="status"
    >
      {children}
    </div>
  );
}

export function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-slate-500">
        {message}
      </td>
    </tr>
  );
}
