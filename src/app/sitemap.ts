import type { MetadataRoute } from 'next';
import { getSitemapEntries } from '@/lib/queries';
import { siteUrl } from '@/lib/seo/metadata';

export const revalidate = 3600;

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly' }[] = [
  { path: '/', priority: 1, changeFrequency: 'daily' },
  { path: '/coloring-pages', priority: 0.9, changeFrequency: 'daily' },
  { path: '/categories', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/books', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/popular', priority: 0.7, changeFrequency: 'daily' },
  { path: '/demo', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/how-to-color', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/contact', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.2, changeFrequency: 'yearly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const { pages, categories, books } = await getSitemapEntries();

  return [
    ...STATIC_ROUTES.map((route) => ({
      url: siteUrl(route.path),
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),

    ...categories.map((category) => ({
      url: siteUrl(`/category/${category.slug}`),
      lastModified: new Date(category.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    })),

    ...books.map((book) => ({
      url: siteUrl(`/book/${book.slug}`),
      lastModified: new Date(book.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    })),

    ...pages.map((page) => ({
      url: siteUrl(`/color/${page.slug}`),
      lastModified: new Date(page.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.65,
    })),
  ];
}
