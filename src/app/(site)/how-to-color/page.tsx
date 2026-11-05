import type { Metadata } from 'next';
import Link from 'next/link';
import { Prose } from '@/components/site/Prose';
import { JsonLd } from '@/components/site/JsonLd';
import { siteUrl } from '@/lib/seo/metadata';
import { faqSchema } from '@/lib/seo/jsonld';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'How to Color Online - A 2-Minute Guide',
  description:
    'Learn the coloring game in two minutes: fill shapes with the bucket, draw with brushes, add stickers, zoom in, undo mistakes and print your artwork.',
  alternates: { canonical: siteUrl('/how-to-color') },
};

const FAQS = [
  {
    q: 'Why will a shape not fill with colour?',
    a: 'You probably tapped directly on a black outline rather than inside a shape. Tap a little further into the white area. If a whole region fills when you only wanted part of it, that area is not closed off by lines in the artwork.',
  },
  {
    q: 'How do I colour very small details?',
    a: 'Pinch with two fingers (or press the + button) to zoom in up to 6x, then drag with two fingers to move around. Zooming also makes the bucket tool far more precise.',
  },
  {
    q: 'Will my child lose their work if they close the tab?',
    a: 'No. Progress is saved automatically on that device after every change, so re-opening the same page brings the colouring back. You will see a "We saved your work!" note when it is restored.',
  },
  {
    q: 'Can I print the picture my child coloured?',
    a: 'Yes - press Print and it prints the coloured version. To print the blank outline for real crayons instead, use the "Download printable PDF" button below the canvas.',
  },
];

export default function HowToColorRoute() {
  return (
    <>
      <JsonLd data={faqSchema(FAQS)} />

      <Prose
        title="How to colour online"
        intro="Everything in the coloring game, in about two minutes."
        trail={[
          { name: 'Home', path: '/' },
          { name: 'How to color', path: '/how-to-color' },
        ]}
      >
        <h2>1. Pick a picture</h2>
        <p>
          Browse <Link href="/categories">the categories</Link> or{' '}
          <Link href="/coloring-pages">every page</Link>, then tap the one you like. The coloring
          canvas opens straight away - nothing to install, no account to make.
        </p>

        <h2>2. Fill shapes with the bucket</h2>
        <p>
          The bucket is selected by default. Choose a colour from the palette and tap inside any
          white shape - it fills instantly, right up to the outlines. Keep tapping to colour the
          whole picture. If a tap does nothing, you hit a line rather than a shape; move your finger
          a little further in.
        </p>

        <h2>3. Draw freely with brushes</h2>
        <p>Switch to the brush tool for shading, hair, grass and anything freehand. Five styles:</p>
        <ul>
          <li>
            <strong>Marker</strong> - clean, solid strokes.
          </li>
          <li>
            <strong>Crayon</strong> - soft waxy texture, like a real crayon.
          </li>
          <li>
            <strong>Rainbow</strong> - the colour shifts as you draw. Children love this one.
          </li>
          <li>
            <strong>Glitter</strong> - scattered sparkles, perfect for magic and night skies.
          </li>
          <li>
            <strong>Stamps</strong> - a trail of little stars and hearts.
          </li>
        </ul>
        <p>Five brush sizes, from fine detail to big background sweeps.</p>

        <h2>4. Add stickers</h2>
        <p>
          Pick a sticker, then tap the picture to drop it in. Sizes run from tiny to huge, and each
          one lands at a slightly different angle so a group never looks stamped.
        </p>

        <h2>5. Fix mistakes</h2>
        <ul>
          <li>
            <strong>Undo</strong> steps back one action at a time (or press <kbd>Ctrl</kbd>+
            <kbd>Z</kbd>). Up to 24 steps are kept.
          </li>
          <li>
            <strong>Eraser</strong> paints an area back to white.
          </li>
          <li>
            <strong>Start over</strong> clears the whole picture - it asks nothing, so use it
            carefully.
          </li>
        </ul>

        <h2>6. Zoom and move</h2>
        <p>
          Pinch to zoom, or use the + and - buttons. Drag with two fingers to pan, or pick the hand
          tool and drag with one. The fit-to-screen button snaps everything back.
        </p>

        <h2>7. Save, print or share</h2>
        <ul>
          <li>
            <strong>Save PNG</strong> downloads the finished artwork as an image.
          </li>
          <li>
            <strong>Print</strong> sends the coloured picture straight to your printer.
          </li>
          <li>
            <strong>Download printable PDF</strong> gives you the blank outline, already sized for
            A4 - for colouring with real crayons.
          </li>
          <li>
            <strong>Share</strong> (on phones) opens the normal share sheet so you can send it to
            grandma.
          </li>
        </ul>

        <h2>8. Collect stars and badges</h2>
        <p>
          Press <strong>I&apos;m done!</strong> when a picture is finished. You get three stars and
          some confetti, and badges unlock as the count goes up - from <em>First Masterpiece</em> at
          one page to <em>Legend of Colour</em> at a hundred. Everything is kept in{' '}
          <Link href="/my-art">your sticker book</Link> on this device.
        </p>

        <h2>Keyboard shortcuts</h2>
        <ul>
          <li>
            <kbd>F</kbd> bucket · <kbd>B</kbd> brush · <kbd>E</kbd> eraser · <kbd>S</kbd> stickers ·{' '}
            <kbd>H</kbd> hand
          </li>
          <li>
            <kbd>Ctrl</kbd>+<kbd>Z</kbd> undo · <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd> redo
          </li>
          <li>
            <kbd>+</kbd> / <kbd>-</kbd> zoom · <kbd>0</kbd> fit to screen
          </li>
        </ul>

        <h2>Common questions</h2>
        {FAQS.map(({ q, a }) => (
          <div key={q}>
            <h3>{q}</h3>
            <p>{a}</p>
          </div>
        ))}
      </Prose>
    </>
  );
}
