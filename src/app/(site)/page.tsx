import Link from 'next/link';
import { Download, MousePointerClick, Printer, Sparkles } from 'lucide-react';
import { getCategoriesWithCounts, getFeaturedPages, getNewestPages, getPopularPages } from '@/lib/queries';
import { getSettings } from '@/lib/settings';
import { isSupabaseConfigured } from '@/lib/env';
import { PageGrid } from '@/components/site/PageGrid';
import { CategoryCard, CategoryRail } from '@/components/site/CategoryCard';
import { SearchBox } from '@/components/site/SearchBox';
import { AdSlot } from '@/components/site/AdSlot';
import { SetupNotice } from '@/components/site/SetupNotice';
import { JsonLd } from '@/components/site/JsonLd';
import { Blobs, CrayonMascot, Sparkles as SparkleDots, WaveDivider } from '@/components/ui/Decor';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState, SectionHeading } from '@/components/ui/Section';
import { faqSchema } from '@/lib/seo/jsonld';
import { RewardStrip } from '@/components/site/RewardStrip';
import { formatNumber } from '@/lib/utils';

export const revalidate = 300;

const FAQS = [
  {
    q: 'Are the coloring pages really free?',
    a: 'Yes. Every page on the site is free to colour online, download as a PNG and print as a PDF. There is no sign-up and no payment.',
  },
  {
    q: 'Can my child colour on a phone or tablet?',
    a: 'Yes. The coloring game is built for touch first: big buttons, pinch to zoom, and a tap-to-fill bucket tool that works with little fingers.',
  },
  {
    q: 'Do I need to install an app?',
    a: 'No. Everything runs in the browser. Work is saved on the device automatically, so your child can come back and finish a picture later.',
  },
  {
    q: 'Can I use these pages in my classroom?',
    a: 'Yes, for personal and classroom use. Print as many as you need. Please do not resell the files or re-publish them as your own.',
  },
  {
    q: 'What do I need to print a coloring page?',
    a: 'Just a printer and A4 or Letter paper. Each page has a Print PDF button that is already sized with margins, so nothing gets cut off.',
  },
];

const STEPS = [
  {
    icon: MousePointerClick,
    emoji: '👆',
    title: 'Pick a picture',
    body: 'Browse animals, cartoons, rockets, princesses and more. Hundreds of pages, all free.',
    tone: 'bg-sunny/20',
  },
  {
    icon: Sparkles,
    emoji: '🪣',
    title: 'Tap to colour',
    body: 'Choose a colour, tap inside a shape and it fills instantly. Brushes, glitter and stickers too.',
    tone: 'bg-coral/20',
  },
  {
    icon: Printer,
    emoji: '🖨️',
    title: 'Save or print',
    body: 'Download your artwork as a PNG, or print the blank page and colour it with real crayons.',
    tone: 'bg-sky/20',
  },
];

export default async function HomePage() {
  const settings = await getSettings();
  const { home, site } = settings;

  const [categories, featured, newest, popular] = isSupabaseConfigured
    ? await Promise.all([
        getCategoriesWithCounts(),
        home.show_featured ? getFeaturedPages(10) : Promise.resolve([]),
        home.show_newest ? getNewestPages(home.grid_size || 20) : Promise.resolve([]),
        home.show_popular ? getPopularPages(10) : Promise.resolve([]),
      ])
    : [[], [], [], []];

  const totalPages = categories.reduce((sum, c) => sum + c.page_count, 0);
  const hasContent = newest.length + featured.length + popular.length > 0;

  return (
    <>
      <JsonLd data={faqSchema(FAQS)} />

      {/* ============================ hero ============================ */}
      <section className="dotted relative overflow-hidden bg-gradient-to-b from-grape-50 via-cream to-cream">
        <Blobs />
        <SparkleDots />

        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 pt-10 pb-16 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pt-16">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 font-display text-xs font-extrabold text-grape-700 shadow-[0_4px_0_var(--color-grape-100)]">
              <Sparkles className="size-3.5" aria-hidden />
              100% free · no sign-up
            </span>

            <h1 className="mt-4 font-display text-4xl leading-[1.05] font-extrabold text-ink sm:text-5xl lg:text-6xl">
              {home.hero_title.split(' ').map((word, i) => (
                <span
                  key={i}
                  className={
                    ['text-grape-600', 'text-coral', 'text-sky-dark', 'text-sunny-dark'][i % 4]
                  }
                >
                  {word}{' '}
                </span>
              ))}
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed font-semibold text-ink-soft sm:text-lg">
              {home.hero_subtitle}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/coloring-pages" tone="grape" size="lg">
                🖍️ {home.hero_cta}
              </ButtonLink>
              <ButtonLink href="/categories" tone="ghost" size="lg">
                Browse categories
              </ButtonLink>
            </div>

            <div className="mt-6 max-w-md">
              <SearchBox />
            </div>

            {totalPages > 0 && (
              <dl className="mt-7 flex flex-wrap gap-x-7 gap-y-3">
                {[
                  { label: 'Coloring pages', value: formatNumber(totalPages) },
                  { label: 'Categories', value: String(categories.length) },
                  { label: 'Price', value: 'Free' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <dt className="text-[11px] font-extrabold tracking-wide text-ink-soft/70 uppercase">
                      {stat.label}
                    </dt>
                    <dd className="font-display text-2xl font-extrabold text-grape-700">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
            <div className="relative">
              <div
                aria-hidden
                className="absolute inset-0 -rotate-6 rounded-[2.5rem] bg-sunny/40"
              />
              <div
                aria-hidden
                className="absolute inset-0 rotate-3 rounded-[2.5rem] bg-coral/30"
              />
              <div className="card-kid relative grid place-items-center overflow-hidden p-6">
                <CrayonMascot className="h-56 w-auto animate-bob sm:h-72" />
                <p className="mt-2 text-center font-display text-lg font-extrabold text-ink">
                  Hi, I&apos;m Cray!
                </p>
                <p className="text-center text-sm font-semibold text-ink-soft">
                  Let&apos;s make something colourful together.
                </p>
              </div>
            </div>
          </div>
        </div>

        <WaveDivider fill="var(--color-cream)" className="-mb-px" />
      </section>

      <SetupNotice />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <AdSlot slot="header" className="mt-4" />

        {categories.length > 0 && (
          <section className="pt-8" aria-label="Quick category links">
            <CategoryRail categories={categories} />
          </section>
        )}

        <RewardStrip />

        {!hasContent && isSupabaseConfigured && (
          <section className="py-14">
            <EmptyState
              emoji="🎨"
              title="The crayon box is still empty"
              message="No coloring pages have been published yet. Try the sample picture below, then sign in to the admin panel and upload your first batch."
              action={
                <div className="flex flex-wrap justify-center gap-3">
                  <ButtonLink href="/demo" tone="grape">
                    Try the coloring game
                  </ButtonLink>
                  <ButtonLink href="/admin" tone="ghost">
                    Open admin panel
                  </ButtonLink>
                </div>
              }
            />
          </section>
        )}

        {featured.length > 0 && (
          <section className="pt-12">
            <SectionHeading
              emoji="⭐"
              title="Top picks this week"
              subtitle="Hand-chosen favourites, ready to colour"
              href="/coloring-pages?sort=popular"
            />
            <PageGrid pages={featured} priorityCount={5} />
          </section>
        )}

        {newest.length > 0 && (
          <section className="pt-14">
            <SectionHeading
              emoji="🆕"
              title="Fresh off the press"
              subtitle="The newest pages we have added"
              href="/coloring-pages"
            />
            <PageGrid pages={newest} adAfter={10} priorityCount={featured.length > 0 ? 0 : 5} />
          </section>
        )}

        {popular.length > 0 && (
          <section className="pt-14">
            <SectionHeading
              emoji="🔥"
              title="Most loved"
              subtitle="What kids are colouring right now"
              href="/popular"
            />
            <PageGrid pages={popular} priorityCount={0} />
          </section>
        )}

        {/* ======================= how it works ======================= */}
        <section className="pt-16" aria-labelledby="how-it-works">
          <h2
            id="how-it-works"
            className="text-center font-display text-2xl font-extrabold text-ink sm:text-3xl"
          >
            How it works
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm font-semibold text-ink-soft">
            Three taps from picking a picture to printing it on the fridge.
          </p>

          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="card-kid relative p-6 text-center">
                <span className="absolute top-4 left-4 grid size-8 place-items-center rounded-full bg-grape-500 font-display text-sm font-extrabold text-white">
                  {i + 1}
                </span>
                <div
                  className={`mx-auto grid size-16 place-items-center rounded-3xl text-3xl ${step.tone}`}
                  aria-hidden
                >
                  {step.emoji}
                </div>
                <h3 className="mt-4 font-display text-lg font-extrabold text-ink">{step.title}</h3>
                <p className="mt-1.5 text-sm font-semibold text-ink-soft">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ======================== categories ======================== */}
        {categories.length > 0 && (
          <section className="pt-16">
            <SectionHeading
              emoji="🗂️"
              title="Pick a theme"
              subtitle="Every collection, from puppies to planets"
              href="/categories"
            />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {categories.slice(0, 8).map((category) => (
                <CategoryCard key={category.id} category={category} count={category.page_count} />
              ))}
            </div>
          </section>
        )}

        {/* =========================== faq =========================== */}
        <section className="pt-16 pb-6" aria-labelledby="faq">
          <h2 id="faq" className="text-center font-display text-2xl font-extrabold text-ink sm:text-3xl">
            Questions parents ask
          </h2>

          <div className="mx-auto mt-8 max-w-3xl space-y-3">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="card-kid group px-5 py-4">
                <summary className="cursor-pointer list-none font-display text-base font-extrabold text-ink marker:hidden">
                  <span className="mr-2 text-grape-500 transition-transform group-open:rotate-90 inline-block" aria-hidden>
                    ▸
                  </span>
                  {q}
                </summary>
                <p className="mt-2.5 pl-6 text-sm leading-relaxed font-semibold text-ink-soft">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ========================== closing ========================== */}
        <section className="pb-8">
          <div className="stripey relative overflow-hidden rounded-[2.5rem] bg-grape-500 px-6 py-12 text-center">
            <div className="relative">
              <p className="text-4xl" aria-hidden>
                🎨
              </p>
              <h2 className="mt-2 font-display text-2xl font-extrabold text-white sm:text-3xl">
                Ready to make something colourful?
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-grape-100">
                {site.tagline}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <ButtonLink href="/coloring-pages" tone="sunny" size="lg">
                  Start colouring
                </ButtonLink>
                <Link
                  href="/my-art"
                  className="btn-kid btn-ghost text-lg"
                >
                  <Download className="size-5" aria-hidden />
                  My sticker book
                </Link>
              </div>
            </div>
          </div>
        </section>

        <AdSlot slot="page_bottom" />
      </div>
    </>
  );
}
