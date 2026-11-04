import { listCategories } from '@/lib/admin/queries';
import { getSession, hasRole } from '@/lib/auth';
import { publicUrl } from '@/lib/r2/public';
import { PageHeader } from '@/components/admin/AdminShell';
import { CategoryManager } from '@/components/admin/CategoryManager';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const [categories, session] = await Promise.all([listCategories(), getSession()]);

  const coverFor = Object.fromEntries(
    categories.filter((c) => c.cover_key).map((c) => [c.id, publicUrl(c.cover_key)]),
  );

  return (
    <>
      <PageHeader
        title="Categories"
        description="Group your coloring pages. The order here is the order on the site."
      />

      <CategoryManager
        categories={categories}
        coverFor={coverFor}
        canDelete={hasRole(session?.profile, 'admin')}
      />
    </>
  );
}
