import Link from 'next/link';
import { CrayonMascot } from '@/components/ui/Decor';

export const metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="dotted grid min-h-dvh place-items-center px-4 py-16 text-center">
      <div>
        <CrayonMascot className="mx-auto h-40 w-auto animate-bob" />

        <p className="text-aurora mt-6 font-display text-7xl font-extrabold tracking-tight">404</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-ink sm:text-3xl">
          This page went off the lines
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm font-semibold text-ink-soft">
          We could not find that one. Let&apos;s get you back to something fun to colour.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-kid">
            Go home
          </Link>
          <Link href="/coloring-pages" className="btn-kid btn-sunny">
            Browse coloring pages
          </Link>
        </div>
      </div>
    </main>
  );
}
