import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/admin/AdminShell';
import { NewBookForm } from '@/components/admin/NewBookForm';

export const dynamic = 'force-dynamic';

export default function NewBookRoute() {
  return (
    <>
      <Link
        href="/admin/books"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to coloring books
      </Link>

      <PageHeader
        title="New coloring book"
        description="Name it first. The next screen is where you choose its pages, its cover and how it reads."
      />

      <div className="mt-5">
        <NewBookForm />
      </div>
    </>
  );
}
