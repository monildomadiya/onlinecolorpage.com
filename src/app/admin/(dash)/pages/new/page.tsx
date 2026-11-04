import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { listCategories } from '@/lib/admin/queries';
import { PageHeader } from '@/components/admin/AdminShell';
import { NewPageForm } from '@/components/admin/NewPageForm';
import { Alert } from '@/components/admin/ui';
import { isR2Configured } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default async function NewPageRoute() {
  const categories = await listCategories();

  return (
    <>
      <Link
        href="/admin/pages"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to coloring pages
      </Link>

      <PageHeader
        title="New coloring page"
        description="Upload one piece of line art with its full details. For whole folders, use bulk upload instead."
      />

      {!isR2Configured && (
        <Alert tone="error">
          Cloudflare R2 is not configured, so this upload will fail. Add the <code>R2_*</code>{' '}
          environment variables first.
        </Alert>
      )}

      <div className="mt-5">
        <NewPageForm categories={categories} />
      </div>
    </>
  );
}
