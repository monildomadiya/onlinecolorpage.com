import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getPageById, listCategories } from '@/lib/admin/queries';
import { getSession, hasRole } from '@/lib/auth';
import { publicUrl } from '@/lib/r2/public';
import { PageHeader } from '@/components/admin/AdminShell';
import { EditPageForm } from '@/components/admin/EditPageForm';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EditPageRoute({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;

  const [page, categories, session] = await Promise.all([
    getPageById(id),
    listCategories(),
    getSession(),
  ]);

  if (!page) notFound();

  return (
    <>
      <Link
        href="/admin/pages"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to coloring pages
      </Link>

      <PageHeader title={page.title} description={`/color/${page.slug}`} />

      <EditPageForm
        page={page}
        categories={categories}
        imageUrl={publicUrl(page.image_key)}
        thumbUrl={publicUrl(page.thumb_key)}
        referenceUrl={page.reference_key ? publicUrl(page.reference_key) : null}
        pdfUrl={page.pdf_key ? publicUrl(page.pdf_key) : null}
        canDelete={hasRole(session?.profile, 'admin')}
        justCreated={(Array.isArray(sp.created) ? sp.created[0] : sp.created) === '1'}
      />
    </>
  );
}
