import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { JsonLd } from '@/components/site/JsonLd';
import { getSettings } from '@/lib/settings';
import { organizationSchema, websiteSchema } from '@/lib/seo/jsonld';
import { siteUrl } from '@/lib/seo/metadata';
import { CrayonMascot } from '@/components/ui/Decor';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const { site, seo, features } = settings;

  if (features.maintenance) {
    return (
      <main className="dotted grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <CrayonMascot className="mx-auto h-40 w-auto animate-bob" />
          <h1 className="mt-6 font-display text-3xl font-extrabold text-ink">
            Sharpening our crayons!
          </h1>
          <p className="mt-2 max-w-sm font-semibold text-ink-soft">
            {site.name} is getting a quick tidy-up. Please pop back in a little while.
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <JsonLd
        data={[
          websiteSchema(site.name, site.description),
          organizationSchema(site.name, siteUrl('/icon-192.png'), [
            seo.facebook,
            seo.instagram,
            seo.twitter,
            seo.pinterest,
          ]),
        ]}
      />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-xl focus:bg-coral focus:px-4 focus:py-2 focus:font-bold focus:text-white"
      >
        Skip to content
      </a>

      <Header />
      <main id="main" className="min-h-[60dvh]">
        {children}
      </main>
      <Footer />
    </>
  );
}
