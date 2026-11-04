import { publicEnv } from '@/lib/env';
import { siteUrl } from './metadata';
import type { Category, ColoringPageWithCategory } from '@/types/db';

type Json = Record<string, unknown>;

export function websiteSchema(siteName: string, description: string): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${publicEnv.siteUrl}#website`,
    name: siteName,
    url: siteUrl('/'),
    description,
    inLanguage: 'en',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: siteUrl('/search?q={search_term_string}'),
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function organizationSchema(siteName: string, logo: string, socials: string[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${publicEnv.siteUrl}#organization`,
    name: siteName,
    url: siteUrl('/'),
    logo,
    sameAs: socials.filter(Boolean),
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: siteUrl(item.path),
    })),
  };
}

/**
 * A coloring page is best modelled as CreativeWork + the image itself, which is
 * what earns the image-rich result in Google and Pinterest.
 */
export function coloringPageSchema(page: ColoringPageWithCategory, imageUrl: string): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': siteUrl(`/color/${page.slug}#work`),
    name: `${page.title} Coloring Page`,
    headline: `${page.title} Coloring Page`,
    description:
      page.description ||
      `Free ${page.title} coloring page - color it online or print the PDF.`,
    url: siteUrl(`/color/${page.slug}`),
    datePublished: page.published_at ?? page.created_at,
    dateModified: page.updated_at,
    isFamilyFriendly: true,
    inLanguage: 'en',
    learningResourceType: 'Coloring page',
    typicalAgeRange: `${page.age_min}-${page.age_max}`,
    keywords: page.tags.join(', '),
    genre: page.category?.name,
    isAccessibleForFree: true,
    license: siteUrl('/terms'),
    image: {
      '@type': 'ImageObject',
      url: imageUrl,
      width: page.width ?? undefined,
      height: page.height ?? undefined,
      caption: `${page.title} coloring page`,
    },
    publisher: { '@id': `${publicEnv.siteUrl}#organization` },
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/ViewAction',
        userInteractionCount: page.view_count,
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/DownloadAction',
        userInteractionCount: page.download_count,
      },
    ],
  };
}

export function categorySchema(
  category: Category,
  pages: ColoringPageWithCategory[],
  imageFor: (page: ColoringPageWithCategory) => string,
): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': siteUrl(`/category/${category.slug}#collection`),
    name: `${category.name} Coloring Pages`,
    description: category.description ?? undefined,
    url: siteUrl(`/category/${category.slug}`),
    isFamilyFriendly: true,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: pages.length,
      itemListElement: pages.slice(0, 30).map((page, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: siteUrl(`/color/${page.slug}`),
        name: page.title,
        image: imageFor(page),
      })),
    },
  };
}

export function faqSchema(items: { q: string; a: string }[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}
