import type { Metadata } from 'next';
import Link from 'next/link';
import { Prose } from '@/components/site/Prose';
import { getSettings } from '@/lib/settings';
import { siteUrl } from '@/lib/seo/metadata';
import { publicEnv } from '@/lib/env';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'What we collect, what we do not, and how children&apos;s artwork stays on their own device. Plain-English privacy policy.',
  alternates: { canonical: siteUrl('/privacy') },
};

export default async function PrivacyRoute() {
  const { site } = await getSettings();
  const domain = publicEnv.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return (
    <Prose
      title="Privacy Policy"
      intro={`How ${site.name} handles data. Short version: we ask children for nothing, and artwork never leaves the device.`}
      updated="3 November 2026"
      trail={[
        { name: 'Home', path: '/' },
        { name: 'Privacy', path: '/privacy' },
      ]}
    >
      <h2>1. Who we are</h2>
      <p>
        {site.name} ({domain}) publishes free coloring pages for children. You can contact us at{' '}
        <a href={`mailto:${site.email}`}>{site.email}</a> about anything on this page.
      </p>

      <h2>2. We do not ask for accounts</h2>
      <p>
        There is no sign-up, no login and no profile for visitors. We never ask a child for a name,
        email address, phone number, photo or age.
      </p>

      <h2>3. Your artwork stays on your device</h2>
      <p>
        When a child colours a picture, the artwork is stored in that browser&apos;s own storage
        (IndexedDB) so it can be finished later. Badges and stars are stored the same way, in
        <code> localStorage</code>. None of it is uploaded to us, and we cannot see it. Clearing
        your browser data deletes it permanently.
      </p>

      <h2>4. What we do measure</h2>
      <p>
        To know which pages are worth adding more of, we record anonymous, aggregated events: that a
        page was viewed, coloured, downloaded or printed. With each event we store the page, a
        timestamp, a broad device type (mobile, tablet or desktop), the referring site and a
        country code where our host provides one.
      </p>
      <p>
        We do <strong>not</strong> store IP addresses, and we do not set an identifier that follows
        you between visits. These events cannot be traced back to a person.
      </p>

      <h2>5. Cookies and local storage</h2>
      <ul>
        <li>
          <strong>Strictly necessary:</strong> an authentication cookie, only for staff who sign in
          to the admin panel. Visitors never receive it.
        </li>
        <li>
          <strong>Preferences (local storage):</strong> your last colour, brush, sound setting and
          saved artwork. Stored on your device, readable only by your browser.
        </li>
        <li>
          <strong>Session storage:</strong> a flag that stops one visit counting as several views.
        </li>
      </ul>
      <p>We do not use cookies to track you across other websites.</p>

      <h2>6. Advertising</h2>
      <p>
        Some pages may carry advertising from Google AdSense, which helps keep everything free. Where
        ads are served to visitors we may see as children, Google is asked to serve only
        non-personalised ads. Google&apos;s own handling of ad data is described in its{' '}
        <a
          href="https://policies.google.com/technologies/partner-sites"
          target="_blank"
          rel="noopener noreferrer"
        >
          privacy and terms for partner sites
        </a>
        . You can opt out of personalised advertising at{' '}
        <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">
          Google Ad Settings
        </a>
        .
      </p>

      <h2>7. Analytics</h2>
      <p>
        If Google Analytics is enabled on this site it runs with IP anonymisation on. You can block
        it with any standard content blocker, or with Google&apos;s{' '}
        <a
          href="https://tools.google.com/dlpage/gaoptout"
          target="_blank"
          rel="noopener noreferrer"
        >
          opt-out add-on
        </a>
        , and nothing on the site will stop working.
      </p>

      <h2>8. Where files are stored</h2>
      <p>
        Coloring page images and PDFs are hosted on Cloudflare R2. The site database (page titles,
        categories, counters) runs on Supabase. The website itself runs on Microsoft Azure. These
        providers process data on our behalf as hosting infrastructure.
      </p>

      <h2>9. Children&apos;s privacy</h2>
      <p>
        This site is intended for children to use with a parent, carer or teacher. Because we collect
        no personal information from anyone, we hold no personal information about a child. If you
        believe a child has somehow sent us personal information - for example in an email - contact
        us and we will delete it.
      </p>

      <h2>10. Your rights</h2>
      <p>
        Since we do not hold information that identifies you, there is normally nothing to access,
        correct or erase. If you have emailed us, you can ask us to delete that correspondence at any
        time.
      </p>

      <h2>11. Changes</h2>
      <p>
        If this policy changes we will update the date at the top of the page. Material changes will
        be announced on the <Link href="/">home page</Link>.
      </p>
    </Prose>
  );
}
