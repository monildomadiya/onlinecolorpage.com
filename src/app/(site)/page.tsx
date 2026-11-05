import Link from 'next/link';
import {
  ChevronRight,
  Download,
  MousePointerClick,
  Palette,
  PaintBucket,
  Printer,
} from 'lucide-react';
import {
  getCategoriesWithCounts,
  getFeaturedPages,
  getNewestPages,
  getPopularPages,
} from '@/lib/queries';
import { getSettings } from '@/lib/settings';
import { isSupabaseConfigured } from '@/lib/env';
import { PageGrid } from '@/components/site/PageGrid';
import { CategoryCard, CategoryRail } from '@/components/site/CategoryCard';
import { SearchBox } from '@/components/site/SearchBox';
import { AdSlot } from '@/components/site/AdSlot';
import { SetupNotice } from '@/components/site/SetupNotice';
import { JsonLd } from '@/components/site/JsonLd';
import { CrayonMascot } from '@/components/ui/Decor';
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
    title: 'Pick a picture',
    body: 'Browse animals, cartoons, rockets, princesses and more. Hundreds of pages, all free.',
    tone: 'var(--color-butter)',
  },
  {
    icon: PaintBucket,
    title: 'Tap to colour',
    body: 'Choose a colour, tap inside a shape and it fills instantly. Brushes, glitter and stickers too.',
    tone: 'var(--color-blush)',
  },
  {
    icon: Printer,
    title: 'Save or print',
    body: 'Download your artwork as a PNG, or print the blank page and colour it with real crayons.',
    tone: 'var(--color-sky)',
  },
];

/**
 * A full-width strip of flat colour.
 *
 * `tone` paints the strip and `ink` is the heading colour inside it. Setting
 * --band-ink here is what lets the card captions and section titles below
 * pick the right contrast without each one being told separately.
 */
function Band({
  tone,
  ink,
  children,
  className = '',
}: {
  tone: string;
  ink: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`w-full ${className}`}
      style={{ background: tone, ['--band-ink' as string]: ink }}
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">{children}</div>
    </section>
  );
}

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

  const words = home.hero_title.trim().split(/\s+/);

  return (
    <>
      <JsonLd data={faqSchema(FAQS)} />

      {/* ============================= hero ============================= */}
      <section className="bg-cream">
        <div className="mx-auto max-w-5xl px-4 pt-14 pb-4 text-center sm:px-6 sm:pt-20">
          <h1 className="font-display text-[2.75rem] leading-[1.05] text-ink sm:text-6xl lg:text-7xl">
            {words.map((word, i) => (
              <span key={i} className={i === words.length - 1 ? 'text-coral' : undefined}>
                {word}{' '}
              </span>
            ))}
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
            {home.hero_subtitle}
          </p>

          <div className="mx-auto mt-8 max-w-lg">
            <SearchBox />
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/coloring-pages" tone="coral" size="lg">
              {home.hero_cta}
            </ButtonLink>
            <ButtonLink href="/categories" tone="ghost" size="lg">
              Browse categories
            </ButtonLink>
          </div>

          {totalPages > 0 && (
            <dl className="mt-10 flex flex-wrap justify-center gap-x-12 gap-y-4">
              {[
                { label: 'Coloring pages', value: formatNumber(totalPages) },
                { label: 'Categories', value: String(categories.length) },
                { label: 'Price', value: 'Free' },
              ].map((stat) => (
                <div key={stat.label}>
                  <dd className="font-display text-2xl text-ink">{stat.value}</dd>
                  <dt className="mt-0.5 text-xs tracking-wide text-ink-soft uppercase">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* The mascot introduces itself on a plain white sheet. */}
        <div className="mx-auto max-w-sm px-4 pb-16 sm:px-6">
          <div className="rounded-[var(--radius-card)] bg-white px-6 py-8 text-center shadow-[var(--shadow-card)]">
            <CrayonMascot className="mx-auto h-48 w-auto animate-bob" />
            <p className="mt-4 font-display text-lg text-ink">Hi, I&apos;m Cray!</p>
            <p className="mt-1 text-sm text-ink-soft">
              Let&apos;s make something colourful together.
            </p>
          </div>
        </div>
      </section>

      <SetupNotice />

      {categories.length > 0 && (
        <section className="bg-cream" aria-label="Quick category links">
          <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
            <CategoryRail categories={categories} />
          </div>
        </section>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <AdSlot slot="header" />
        <RewardStrip />
      </div>

      {!hasContent && isSupabaseConfigured && (
        <section className="bg-cream">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <EmptyState
              icon={Palette}
              title="The crayon box is still empty"
              message="No coloring pages have been published yet. Try the sample picture below, then sign in to the admin panel and upload your first batch."
              action={
                <div className="flex flex-wrap justify-center gap-3">
                  <ButtonLink href="/demo" tone="coral">
                    Try the coloring game
                  </ButtonLink>
                  <ButtonLink href="/admin" tone="ghost">
                    Open admin panel
                  </ButtonLink>
                </div>
              }
            />
          </div>
        </section>
      )}

      {/* ------------------------ coloured runs ------------------------ */}
      {featured.length > 0 && (
        <Band tone="var(--color-butter)" ink="var(--color-butter-dark)">
          <SectionHeading
            band="var(--color-butter-dark)"
            title="Top picks this week"
            subtitle="Hand-chosen favourites, ready to colour"
            href="/coloring-pages?sort=popular"
          />
          <PageGrid pages={featured} priorityCount={5} />
        </Band>
      )}

      {newest.length > 0 && (
        <Band tone="var(--color-mint)" ink="var(--color-mint-dark)">
          <SectionHeading
            band="var(--color-mint-dark)"
            title="Fresh off the press"
            subtitle="The newest pages we have added"
            href="/coloring-pages"
          />
          <PageGrid pages={newest} adAfter={10} priorityCount={featured.length > 0 ? 0 : 5} />
        </Band>
      )}

      {popular.length > 0 && (
        <Band tone="var(--color-blush)" ink="var(--color-blush-dark)">
          <SectionHeading
            band="var(--color-blush-dark)"
            title="Most loved"
            subtitle="What kids are colouring right now"
            href="/popular"
          />
          <PageGrid pages={popular} priorityCount={0} />
        </Band>
      )}

      {/* ========================= how it works ========================= */}
      <section className="bg-cream" aria-labelledby="how-it-works">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 id="how-it-works" className="text-center font-display text-[2rem] text-ink sm:text-[2.75rem]">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-ink-soft sm:text-base">
            Three taps from picking a picture to printing it on the fridge.
          </p>

          <ol className="mt-12 grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="text-center">
                <div
                  className="mx-auto grid size-20 place-items-center rounded-2xl text-ink"
                  style={{ background: step.tone }}
                  aria-hidden
                >
                  <step.icon className="size-9" strokeWidth={1.75} />
                </div>
                <p className="mt-4 text-xs tracking-[0.12em] text-ink-soft uppercase">
                  Step {i + 1}
                </p>
                <h3 className="mt-1 font-display text-lg text-ink">{step.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* =========================== categories =========================== */}
      {categories.length > 0 && (
        <Band tone="var(--color-sky)" ink="var(--color-sky-dark)">
          <SectionHeading
            band="var(--color-sky-dark)"
            title="Pick a theme"
            subtitle="Every collection, from puppies to planets"
            href="/categories"
          />
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {categories.slice(0, 8).map((category) => (
              <CategoryCard key={category.id} category={category} count={category.page_count} />
            ))}
          </div>
        </Band>
      )}

      {/* ============================== faq ============================== */}
      <section className="bg-cream" aria-labelledby="faq">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 id="faq" className="text-center font-display text-[2rem] text-ink sm:text-[2.75rem]">
            Questions parents ask
          </h2>

          <div className="mt-10 divide-y divide-ink/10 border-y border-ink/10">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-start gap-3 text-base font-medium text-ink marker:hidden">
                  <ChevronRight
                    className="mt-1 size-4 shrink-0 text-coral transition-transform duration-200 group-open:rotate-90"
                    aria-hidden
                  />
                  {q}
                </summary>
                <p className="mt-3 pl-7 text-sm leading-relaxed text-ink-soft">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ closing ============================ */}
      <Band tone="var(--color-lilac)" ink="var(--color-lilac-dark)" className="text-center">
        <h2 className="font-display text-[2rem] text-lilac-dark sm:text-[2.75rem]">
          Ready to make something colourful?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink-soft sm:text-base">{site.tagline}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/coloring-pages" tone="coral" size="lg">
            Start colouring
          </ButtonLink>
          <Link href="/my-art" className="btn-kid btn-ghost px-8 py-4 text-lg">
            <Download className="size-5" aria-hidden />
            My sticker book
          </Link>
        </div>
      </Band>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <AdSlot slot="page_bottom" />
      </div>
    </>
  );
}
