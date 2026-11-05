import type { Metadata } from 'next';
import { MyArtGallery } from '@/components/site/MyArtGallery';
import { Breadcrumbs } from '@/components/ui/Section';
import { siteUrl } from '@/lib/seo/metadata';

export const metadata: Metadata = {
  title: 'My Sticker Book - Your Saved Coloring',
  description:
    'Every picture you have coloured, saved privately on this device. Finish an old one, download it, or start something new.',
  alternates: { canonical: siteUrl('/my-art') },
  robots: { index: false, follow: true },
};

export default function MyArtRoute() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-6">
      <Breadcrumbs
        trail={[
          { name: 'Home', path: '/' },
          { name: 'My sticker book', path: '/my-art' },
        ]}
      />

      <header className="mb-8">
        <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">
          My sticker book
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold text-ink-soft sm:text-base">
          Your artwork and badges live on this device only - nothing is uploaded and no account is
          needed. Clearing your browser data will clear them too.
        </p>
      </header>

      <MyArtGallery />
    </div>
  );
}
