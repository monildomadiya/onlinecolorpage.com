'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Site search. Deliberately takes the current term as a prop instead of
 * reading useSearchParams(): the header renders on every page, and a
 * useSearchParams() hook there would force every static page to bail out to
 * client rendering.
 */
export function SearchBox({
  defaultValue = '',
  className,
  placeholder = 'Search cats, rockets, unicorns...',
  autoFocus = false,
}: {
  defaultValue?: string;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const q = value.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/coloring-pages');
  }

  return (
    <form onSubmit={submit} role="search" className={cn('relative w-full', className)}>
      <label htmlFor="site-search" className="sr-only">
        Search coloring pages
      </label>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-grape-400"
      />
      <input
        id="site-search"
        name="q"
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        enterKeyHint="search"
        className="h-12 w-full rounded-2xl border-2 border-grape-100 bg-white pr-24 pl-12 text-base font-bold text-ink placeholder:font-semibold placeholder:text-ink-soft/50 focus:border-grape-400 focus:outline-none"
      />
      <button
        type="submit"
        className="btn-kid absolute top-1.5 right-1.5 h-9 rounded-xl px-4 text-sm"
      >
        Go
      </button>
    </form>
  );
}
