import type { MetadataRoute } from 'next';
import { getSettings } from '@/lib/settings';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { site } = await getSettings();

  return {
    name: `${site.name} - free coloring pages for kids`,
    short_name: site.name,
    description: site.description,
    start_url: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#fff8ef',
    theme_color: '#8b4ff5',
    categories: ['kids', 'education', 'entertainment'],
    icons: [
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
    shortcuts: [
      { name: 'All coloring pages', url: '/coloring-pages' },
      { name: 'Categories', url: '/categories' },
      { name: 'My sticker book', url: '/my-art' },
    ],
  };
}
