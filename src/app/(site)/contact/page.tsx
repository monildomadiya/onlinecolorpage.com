import type { Metadata } from 'next';
import { Mail } from 'lucide-react';
import { Prose } from '@/components/site/Prose';
import { getSettings } from '@/lib/settings';
import { siteUrl } from '@/lib/seo/metadata';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Request a coloring page theme, report a problem, or ask about using our pages in your classroom.',
  alternates: { canonical: siteUrl('/contact') },
};

export default async function ContactRoute() {
  const { site } = await getSettings();

  return (
    <Prose
      title="Contact us"
      emoji="✉️"
      intro="Requests, broken pages, classroom questions - all welcome."
      trail={[
        { name: 'Home', path: '/' },
        { name: 'Contact', path: '/contact' },
      ]}
    >
      <p>
        We read everything and usually reply within a couple of working days. The fastest way to
        reach us is email:
      </p>

      <p className="!mt-4">
        <a
          href={`mailto:${site.email}`}
          className="btn-kid !text-white !no-underline"
        >
          <Mail className="size-5" aria-hidden />
          {site.email}
        </a>
      </p>

      <h2>Please include</h2>
      <ul>
        <li>
          <strong>Requesting a theme?</strong> Tell us the subject and roughly what age it is for.
        </li>
        <li>
          <strong>Something broken?</strong> The page URL, plus the device and browser you were
          using.
        </li>
        <li>
          <strong>Copyright concern?</strong> The page URL and proof of ownership - we remove
          confirmed cases quickly.
        </li>
        <li>
          <strong>Classroom or library use?</strong> Our <a href="/terms">terms</a> already allow
          printing and handing out copies, so you may not need to ask at all.
        </li>
      </ul>

      <h2>A note for children</h2>
      <p>
        If you are a child, please ask a grown-up to email us for you. We never ask children for
        their name, age or address.
      </p>
    </Prose>
  );
}
