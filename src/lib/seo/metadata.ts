import type { Metadata } from 'next';
import { publicEnv } from '@/lib/env';
import { getSettings } from '@/lib/settings';
import { publicUrl } from '@/lib/r2/public';
import { excerptFromHtml } from '@/lib/html';
import type { Book, Category, ColoringPageWithCategory } from '@/types/db';

export function siteUrl(path = '/'): string {
  const base = publicEnv.siteUrl.replace(/\/+$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function truncate(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}...`;
}

/** Base metadata for the root layout. */
export async function buildRootMetadata(): Promise<Metadata> {
  const { site, seo } = await getSettings();
  const ogImage = seo.og_image_key ? publicUrl(seo.og_image_key) : null;

  return {
    metadataBase: new URL(publicEnv.siteUrl),
    title: {
      default: seo.default_title,
      template: `%s${seo.title_suffix}`,
    },
    description: seo.default_description,
    applicationName: site.name,
    keywords: [
      'coloring pages',
      'free coloring pages',
      'printable coloring pages',
      'online coloring',
      'coloring games for kids',
      'colouring pages',
      'kids activities',
    ],
    authors: [{ name: site.name, url: siteUrl('/') }],
    creator: site.name,
    publisher: site.name,
    manifest: '/manifest.webmanifest',
    alternates: { canonical: siteUrl('/') },
    openGraph: {
      type: 'website',
      siteName: site.name,
      title: seo.default_title,
      description: seo.default_description,
      url: siteUrl('/'),
      locale: 'en_US',
      // Only set explicitly when the admin uploaded one; otherwise Next's
      // app/opengraph-image.tsx convention supplies the generated card.
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: site.name }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.default_title,
      description: seo.default_description,
      ...(ogImage ? { images: [ogImage] } : {}),
      site: seo.twitter || undefined,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: '16x16 32x32 48x48', type: 'image/x-icon' },
        { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      ],
      shortcut: '/favicon.ico',
      apple: '/apple-icon.png',
    },
    category: 'kids',
  };
}

/** Metadata for a single coloring page. */
export async function buildPageMetadata(page: ColoringPageWithCategory): Promise<Metadata> {
  const { site } = await getSettings();
  const url = siteUrl(`/color/${page.slug}`);
  const image = publicUrl(page.thumb_key ?? page.image_key);

  const title = page.seo_title || `${page.title} Coloring Page - Free Printable & Online`;
  const description =
    page.seo_description ||
    truncate(
      page.description ||
        `Color the ${page.title.toLowerCase()} coloring page online for free, then download the PNG or print the PDF. ${
          page.category ? `Part of our ${page.category.name} collection.` : ''
        }`,
    );

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title,
      description,
      url,
      siteName: site.name,
      images: [{ url: image, alt: `${page.title} coloring page`, width: 600, height: 800 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

/** Metadata for a coloring book. */
export async function buildBookMetadata(book: Book, pageCount: number): Promise<Metadata> {
  const { site } = await getSettings();
  const url = siteUrl(`/book/${book.slug}`);
  const image = book.cover_key ? publicUrl(book.cover_key) : null;

  const title =
    book.seo_title || `${book.title} - Free Printable Coloring Book (${pageCount} Pages)`;
  const description =
    book.seo_description ||
    truncate(
      book.description ||
        // The long body is the richest thing we have when nothing shorter was
        // written, so it stands in rather than leaving the snippet to Google.
        excerptFromHtml(book.body_html, 320) ||
        `Download ${book.title} as one printable PDF - ${pageCount} free coloring page${
          pageCount === 1 ? '' : 's'
        } for kids, ready for A4 paper.`,
    );

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'book',
      title,
      description,
      url,
      siteName: site.name,
      ...(image ? { images: [{ url: image, alt: `${book.title} coloring book` }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

/** Metadata for a category listing. */
export async function buildCategoryMetadata(
  category: Category,
  total: number,
): Promise<Metadata> {
  const { site } = await getSettings();
  const url = siteUrl(`/category/${category.slug}`);
  const image = category.cover_key ? publicUrl(category.cover_key) : null;

  const title =
    category.seo_title || `${category.name} Coloring Pages - ${total} Free Printables`;
  const description =
    category.seo_description ||
    truncate(
      category.description ||
        `Browse ${total} free ${category.name.toLowerCase()} coloring pages. Color them online in your browser or print the PDF at home.`,
    );

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title,
      description,
      url,
      siteName: site.name,
      ...(image ? { images: [{ url: image, alt: `${category.name} coloring pages` }] } : {}),
    },
  };
}
