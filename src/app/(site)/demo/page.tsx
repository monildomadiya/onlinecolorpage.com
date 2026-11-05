import type { Metadata } from 'next';
import Link from 'next/link';
import { ColoringStudio } from '@/components/coloring/ColoringStudio';
import { Breadcrumbs } from '@/components/ui/Section';
import { getSettings } from '@/lib/settings';
import { siteUrl } from '@/lib/seo/metadata';
import { publicEnv } from '@/lib/env';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Try the Online Coloring Game - Free Demo',
  description:
    'Try our online coloring game right now with a sample picture. Tap to fill, draw with brushes, add stickers, then save or print - no sign-up needed.',
  alternates: { canonical: siteUrl('/demo') },
};

/**
 * A self-contained playground that uses a line-art file from /public rather
 * than R2, so the coloring game works on a brand-new deployment before any
 * pages have been uploaded.
 */
export default async function DemoRoute() {
  const { site, features } = await getSettings();
  const domain = publicEnv.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-6">
      <Breadcrumbs
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Try it', path: '/demo' },
        ]}
      />

      <header className="mb-5">
        <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">
          Try the coloring game
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold text-ink-soft sm:text-base">
          A sample picture to play with. Pick a colour, tap inside a shape, and it fills instantly.
          Everything works exactly as it does on a real coloring page.
        </p>
      </header>

      <ColoringStudio
        slug="demo-sunny-garden"
        title="Sunny Garden"
        imageUrl="/images/sample-line-art.png"
        suggestedColors={['#FFC83D', '#FF6B81', '#38BDF8', '#34D399', '#A3E635', '#F472B6']}
        siteName={site.name}
        watermark={domain}
        soundDefault={features.sounds_default_on}
        confettiEnabled={features.confetti}
        rewardsEnabled={features.rewards}
        guideEnabled={false}
        downloadsEnabled
      />

      <section className="card-kid mt-8 p-6">
        <h2 className="font-display text-xl font-extrabold text-ink">Liked that?</h2>
        <p className="mt-2 text-sm font-semibold text-ink-soft">
          There are plenty more pictures waiting - animals, rockets, princesses, dinosaurs and
          more.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/coloring-pages" className="btn-kid">
            Browse all coloring pages
          </Link>
          <Link href="/how-to-color" className="btn-kid btn-ghost">
            How it works
          </Link>
        </div>
      </section>
    </div>
  );
}
