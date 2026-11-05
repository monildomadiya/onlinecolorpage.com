import type { Metadata } from 'next';
import Link from 'next/link';
import { Prose } from '@/components/site/Prose';
import { getSettings } from '@/lib/settings';
import { siteUrl } from '@/lib/seo/metadata';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Terms of Use',
  description:
    'What you may and may not do with our free coloring pages. Personal and classroom use is welcome; reselling is not.',
  alternates: { canonical: siteUrl('/terms') },
};

export default async function TermsRoute() {
  const { site } = await getSettings();

  return (
    <Prose
      title="Terms of Use"
      intro="Plain-English rules for using the coloring pages on this site."
      updated="3 November 2026"
      trail={[
        { name: 'Home', path: '/' },
        { name: 'Terms', path: '/terms' },
      ]}
    >
      <h2>1. Using the site</h2>
      <p>
        {site.name} is free to use. By using it you agree to these terms. If you are under 18, please
        use the site with a parent, carer or teacher.
      </p>

      <h2>2. What you may do</h2>
      <ul>
        <li>Colour any page online, as many times as you like.</li>
        <li>Download the PNG or PDF and print it at home.</li>
        <li>
          Print and hand out copies in a classroom, nursery, library, hospital or childminding
          setting.
        </li>
        <li>Share your finished artwork with family and friends, including on social media.</li>
        <li>Link to any page on this site.</li>
      </ul>

      <h2>3. What you may not do</h2>
      <ul>
        <li>Sell, license or hand out our files as a paid product, bundle or printable pack.</li>
        <li>Re-publish the files on another website, app or stock library as your own.</li>
        <li>Remove credits or watermarks and present the artwork as original work.</li>
        <li>
          Scrape the site in bulk or hammer it with automated requests. If you need many files for a
          legitimate project, <Link href="/contact">just ask</Link>.
        </li>
        <li>Use the site in a way that breaks the law or disrupts it for other people.</li>
      </ul>

      <h2>4. Who owns what</h2>
      <p>
        The site design, text and code belong to us. Each coloring page is either created by us,
        licensed to us, or in the public domain. The colouring <em>your child</em> adds is theirs -
        we claim no rights over a finished picture.
      </p>
      <p>
        If you believe a page infringes your copyright, email us with the page URL and proof of
        ownership and we will remove it promptly.
      </p>

      <h2>5. Characters and brands</h2>
      <p>
        Some pages depict characters that may be trademarks of their owners. Those pages are offered
        as fan artwork for personal, non-commercial colouring only. We are not affiliated with,
        endorsed by or sponsored by any character&apos;s rights holder. Rights holders can contact us
        for removal at any time.
      </p>

      <h2>6. No warranty</h2>
      <p>
        The site is provided &ldquo;as is&rdquo;. We try hard to keep it working and safe, but we
        cannot promise it will always be available, bug-free, or that every file will print perfectly
        on every printer.
      </p>

      <h2>7. Liability</h2>
      <p>
        To the extent the law allows, we are not liable for indirect or consequential loss arising
        from using the site. Nothing here limits liability that cannot legally be limited.
      </p>

      <h2>8. Changes</h2>
      <p>
        We may update these terms. The date at the top shows when they last changed. Continuing to
        use the site means you accept the current version.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions about these terms? <Link href="/contact">Get in touch</Link> or email{' '}
        <a href={`mailto:${site.email}`}>{site.email}</a>.
      </p>
    </Prose>
  );
}
