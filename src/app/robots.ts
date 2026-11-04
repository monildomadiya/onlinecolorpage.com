import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo/metadata';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Search results and the private gallery add nothing to the index.
        disallow: ['/admin', '/admin/', '/api/', '/search', '/my-art'],
      },
    ],
    sitemap: siteUrl('/sitemap.xml'),
    host: siteUrl('/'),
  };
}
