import Link from 'next/link';
import { listCategories } from '@/lib/admin/queries';
import { PageHeader } from '@/components/admin/AdminShell';
import { Uploader } from '@/components/admin/Uploader';
import { Alert } from '@/components/admin/ui';
import { isR2Configured } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default async function BulkUploadPage() {
  const categories = await listCategories();

  return (
    <>
      <PageHeader
        title="Bulk upload"
        description="Drop in a whole folder of line art. Thumbnails, printable PDFs and slugs are all generated for you."
      />

      {!isR2Configured && (
        <Alert tone="error">
          Cloudflare R2 is not configured, so uploads will fail. Add the <code>R2_*</code>{' '}
          environment variables and restart.
        </Alert>
      )}

      {categories.length === 0 && (
        <Alert tone="warning">
          You have no categories yet. Pages will be uncategorised -{' '}
          <Link href="/admin/categories" className="underline">
            create a few first
          </Link>{' '}
          if you want them grouped.
        </Alert>
      )}

      <div className="mt-5">
        <Uploader categories={categories} />
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
        <h2 className="text-base font-extrabold text-slate-900">What happens to each file</h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5">
          <li>Flattened onto white and capped at 2000px, saved as PNG - the colouring master.</li>
          <li>A 600px WebP thumbnail for grids and social previews.</li>
          <li>An A4 print PDF with margins and a small site credit in the footer.</li>
          <li>All three land in Cloudflare R2; the row goes into Supabase.</li>
          <li>
            The slug comes from the title (<code>Cute Cat</code> → <code>cute-cat</code>), with a
            number appended if it is taken.
          </li>
        </ol>
        <p className="mt-3 text-xs text-slate-500">
          Best results come from clean black-on-white line art. Avoid grey fills - the fill tool
          treats dark pixels as outlines.
        </p>
      </section>
    </>
  );
}
