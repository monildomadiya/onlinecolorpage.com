import type { Metadata } from 'next';
import Link from 'next/link';
import { Prose } from '@/components/site/Prose';
import { getSettings } from '@/lib/settings';
import { siteUrl } from '@/lib/seo/metadata';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Who we are and why we give away thousands of free coloring pages for kids - online and printable, with no sign-up.',
  alternates: { canonical: siteUrl('/about') },
};

export default async function AboutRoute() {
  const { site } = await getSettings();

  return (
    <Prose
      title={`About ${site.name}`}
      intro={site.tagline}
      trail={[
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about' },
      ]}
    >
      <h2>Why we built this</h2>
      <p>
        Colouring is one of the few screen-free-feeling activities that genuinely helps small
        children: it builds pencil grip, patience and colour recognition, and it gives a child
        something finished to be proud of. Most coloring sites bury that behind pop-ups, broken
        print buttons and sign-up walls.
      </p>
      <p>
        {site.name} is our attempt at the opposite. Pick a picture, colour it with your finger or a
        mouse, and either save it or print the blank outline. No account, no cost, no nagging.
      </p>

      <h2>What you get</h2>
      <ul>
        <li>
          <strong>An online coloring game</strong> - tap-to-fill buckets, brushes, crayon and
          glitter textures, stickers, undo, pinch-to-zoom and automatic saving.
        </li>
        <li>
          <strong>Printable PDFs</strong> - every page comes as a print-ready A4 file with proper
          margins, so nothing gets chopped off at the edge.
        </li>
        <li>
          <strong>PNG downloads</strong> - save your finished artwork, or the blank outline to
          colour with real crayons.
        </li>
        <li>
          <strong>Works on anything</strong> - phones, tablets, Chromebooks and classroom desktops.
        </li>
      </ul>

      <h2>Made for small hands</h2>
      <p>
        Everything is designed touch-first: big buttons, high contrast, and a bucket tool forgiving
        enough that a four-year-old can use it. Sound effects can be muted, and the whole interface
        respects your device&apos;s reduced-motion setting.
      </p>

      <h2>For parents and teachers</h2>
      <p>
        All pages are free for personal and classroom use - print as many copies as you need. We do
        not ask children for names, emails or logins. Artwork is saved in your own browser and never
        uploaded. See our <Link href="/privacy">privacy policy</Link> for the details, and{' '}
        <Link href="/terms">terms of use</Link> for what you may do with the files.
      </p>

      <h2>Say hello</h2>
      <p>
        Found a broken page, or want to request a theme? We would genuinely like to hear it -{' '}
        <Link href="/contact">get in touch</Link>.
      </p>
    </Prose>
  );
}
