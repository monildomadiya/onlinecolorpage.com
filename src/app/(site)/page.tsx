import Link from "next/link";
import {
  ChevronRight,
  Download,
  Heart,
  MousePointerClick,
  Palette,
  PaintBucket,
  Printer,
  Share2,
  Sparkles,
} from "lucide-react";
import {
  getCategoriesWithCounts,
  getFeaturedPages,
  getNewestPages,
  getPopularPages,
} from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { isSupabaseConfigured } from "@/lib/env";
import { PageGrid } from "@/components/site/PageGrid";
import { CategoryCard, CategoryRail } from "@/components/site/CategoryCard";
import { AdSlot } from "@/components/site/AdSlot";
import { SetupNotice } from "@/components/site/SetupNotice";
import { JsonLd } from "@/components/site/JsonLd";
import { HomeHero } from "@/components/site/HomeHero";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, SectionHeading } from "@/components/ui/Section";
import { faqSchema } from "@/lib/seo/jsonld";
import { RewardStrip } from "@/components/site/RewardStrip";

export const revalidate = 300;

const FAQS = [
  {
    q: "Are the coloring pages really free?",
    a: "Yes. Every page on the site is free to colour online, download as a PNG and print as a PDF. There is no sign-up and no payment.",
  },
  {
    q: "Can my child colour on a phone or tablet?",
    a: "Yes. The coloring game is built for touch first: big buttons, pinch to zoom, and a tap-to-fill bucket tool that works with little fingers.",
  },
  {
    q: "Do I need to install an app?",
    a: "No. Everything runs in the browser. Work is saved on the device automatically, so your child can come back and finish a picture later.",
  },
  {
    q: "Can I use these pages in my classroom?",
    a: "Yes, for personal and classroom use. Print as many as you need. Please do not resell the files or re-publish them as your own.",
  },
  {
    q: "What do I need to print a coloring page?",
    a: "Just a printer and A4 or Letter paper. Each page has a Print PDF button that is already sized with margins, so nothing gets cut off.",
  },
];

const STEPS = [
  {
    icon: MousePointerClick,
    title: "Pick a picture",
    body: "Browse animals, cartoons, rockets, princesses and more. Hundreds of pages, all free.",
    tone: "var(--color-blush)",
  },
  {
    icon: PaintBucket,
    title: "Tap to colour",
    body: "Choose a colour, tap inside a shape and it fills instantly. Brushes, glitter and stickers too.",
    tone: "var(--color-lilac)",
  },
  {
    icon: Printer,
    title: "Save or print",
    body: "Download your artwork as a PNG, or print the blank page and colour it with real crayons.",
    tone: "var(--color-mint)",
  },
];

/** The three one-line promises in the "what this is" panel. */
const PITCH = [
  {
    tone: "var(--color-blush)",
    title: "Colour online in one tap",
    body: "Open any picture and start filling shapes straight away - nothing to download.",
  },
  {
    tone: "var(--color-lilac)",
    title: "Made for every age",
    body: "Chunky shapes for little ones, detailed pages for grown-ups who like to unwind.",
  },
  {
    tone: "var(--color-mint)",
    title: "Keep what you make",
    body: "Artwork is saved on the device, so a half-finished picture waits for tomorrow.",
  },
];

/** The "who it is for" list, numbered like a notebook. */
const AUDIENCE = [
  {
    tone: "var(--color-coral)",
    title: "Kids and families",
    body: "Easy pages for a rainy afternoon at the kitchen table.",
  },
  {
    tone: "var(--color-lilac)",
    title: "Teens and adults",
    body: "Detailed line art for a calm, focus-friendly break.",
  },
  {
    tone: "var(--color-sky)",
    title: "Parents and teachers",
    body: "Print a stack in seconds for home or the classroom.",
  },
  {
    tone: "var(--color-mint)",
    title: "Phones and tablets",
    body: "Touch-first tools that work with little fingers.",
  },
];

/** The soft three-up strip under the steps. */
const MOODS = [
  {
    emoji: "🎨",
    tone: "var(--color-blush)",
    title: "Start colouring",
    body: "Just open a page and enjoy it.",
  },
  {
    emoji: "💛",
    tone: "var(--color-butter)",
    title: "A quiet pause",
    body: "Colour slowly and let the day settle.",
  },
  {
    emoji: "✨",
    tone: "var(--color-mint)",
    title: "Show it off",
    body: "Save it, print it, stick it on the fridge.",
  },
];

/**
 * A section of the page, as a sheet of paper.
 *
 * Everything on this page is one of these: the page colour never changes, so
 * rhythm comes from the panels themselves - their width, their wash, and the
 * gaps of bare peach between them.
 *
 * `wash` tints the sheet with one of the pastels; leaving it out keeps the
 * sheet white. `holes` punches a row of notebook holes along the top edge.
 */
function Panel({
  children,
  wash,
  holes = false,
  className = "",
  ...rest
}: {
  children: React.ReactNode;
  wash?: string;
  holes?: boolean;
  className?: string;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    // Every panel shares one measure. A narrower sheet in the middle of the
    // stack reads as a mistake rather than as emphasis, because the peach
    // margin beside it is the only thing that changes.
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8" {...rest}>
      <div
        className={`panel ${wash ? "panel-wash" : ""} ${
          holes ? "panel-holes" : ""
        } mx-auto px-5 ${
          holes ? "pt-12" : "pt-10"
        } pb-10 sm:px-10 sm:pb-14 ${holes ? "sm:pt-16" : "sm:pt-14"} ${className}`}
        style={wash ? { ["--wash" as string]: wash } : undefined}
      >
        {children}
      </div>
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
        home.show_newest
          ? getNewestPages(home.grid_size || 20)
          : Promise.resolve([]),
        home.show_popular ? getPopularPages(10) : Promise.resolve([]),
      ])
    : [[], [], [], []];

  const totalPages = categories.reduce((sum, c) => sum + c.page_count, 0);
  const hasContent = newest.length + featured.length + popular.length > 0;

  return (
    <>
      <JsonLd data={faqSchema(FAQS)} />

      {/* ============================= hero ============================= */}
      <HomeHero
        title={home.hero_title}
        subtitle={home.hero_subtitle}
        cta={home.hero_cta}
        totalPages={totalPages}
        categoryCount={categories.length}
      />

      <SetupNotice />

      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6" aria-label="Quick category links">
          <CategoryRail categories={categories} />
        </section>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <AdSlot slot="header" />
        <RewardStrip />
      </div>

      {/* ========================= what this is ========================= */}
      <Panel aria-labelledby="what-this-is">
        <span
          aria-hidden
          className="tape -top-3 left-12 -rotate-3"
          style={{ ["--tape" as string]: "var(--color-blush)" }}
        />

        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
          <div>
            <p className="eyebrow">What this site is</p>
            <h2
              id="what-this-is"
              className="mt-4 font-display text-[1.9rem] leading-tight text-ink sm:text-[2.6rem]"
            >
              A calm place to colour{" "}
              <span className="swoosh" style={{ ["--swoosh" as string]: "var(--color-butter)" }}>
                online
              </span>
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-soft sm:text-base">
              {site.description}
            </p>

            <ul className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {PITCH.map((item) => (
                <li
                  key={item.title}
                  className="rounded-[1.25rem] border border-edge bg-cream/60 p-4"
                  style={{
                    borderColor: `color-mix(in srgb, ${item.tone} 30%, var(--color-edge))`,
                  }}
                >
                  <span
                    aria-hidden
                    className="mb-3 block h-1.5 w-10 rounded-full"
                    style={{ background: item.tone }}
                  />
                  <h3 className="font-display text-base text-ink">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* who it is for */}
          <div className="rounded-[1.5rem] border border-edge bg-cream/50 p-5 sm:p-7">
            <p className="eyebrow">Who it is for</p>
            <ol className="mt-5 divide-y divide-edge">
              {AUDIENCE.map((item, i) => (
                <li key={item.title} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <span
                    aria-hidden
                    className="grid size-9 shrink-0 place-items-center rounded-xl text-sm font-bold text-white"
                    style={{ background: item.tone }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-display text-base text-ink">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/categories" tone="coral" size="sm">
                View all themes
              </ButtonLink>
              <ButtonLink href="/how-to-color" tone="ghost" size="sm">
                How it works
              </ButtonLink>
            </div>
          </div>
        </div>
      </Panel>

      {!hasContent && isSupabaseConfigured && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
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
        </section>
      )}

      {/* ------------------------- picture panels ------------------------- */}
      {featured.length > 0 && (
        <Panel>
          <span
            aria-hidden
            className="tape -top-3 right-14 rotate-6"
            style={{ ["--tape" as string]: "var(--color-butter)" }}
          />
          <SectionHeading
            eyebrow="Staff picks"
            band="var(--color-butter)"
            title="Top picks this week"
            subtitle="Hand-chosen favourites, ready to colour"
            href="/coloring-pages?sort=popular"
          />
          <PageGrid pages={featured} priorityCount={5} />
        </Panel>
      )}

      {newest.length > 0 && (
        <Panel>
          <span
            aria-hidden
            className="tape -top-3 left-14 -rotate-6"
            style={{ ["--tape" as string]: "var(--color-mint)" }}
          />
          <SectionHeading
            eyebrow="Just added"
            band="var(--color-mint)"
            title="Fresh off the press"
            subtitle="The newest pages we have added"
            href="/coloring-pages"
          />
          <PageGrid
            pages={newest}
            adAfter={10}
            priorityCount={featured.length > 0 ? 0 : 5}
          />
        </Panel>
      )}

      {popular.length > 0 && (
        <Panel>
          <span
            aria-hidden
            className="tape -top-3 right-14 rotate-3"
            style={{ ["--tape" as string]: "var(--color-blush)" }}
          />
          <SectionHeading
            eyebrow="Most coloured"
            band="var(--color-blush)"
            title="Most loved"
            subtitle="What kids are colouring right now"
            href="/popular"
          />
          <PageGrid pages={popular} priorityCount={0} />
        </Panel>
      )}

      {/* ========================= how it works ========================= */}
      <Panel holes aria-labelledby="how-it-works">
        <div className="text-center">
          <h2
            id="how-it-works"
            className="font-display text-[1.9rem] leading-tight text-ink sm:text-[2.6rem]"
          >
            Three simple steps{" "}
            <span className="swoosh" style={{ ["--swoosh" as string]: "var(--color-coral-soft)" }}>
              to start colouring
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm text-ink-soft sm:text-base">
            Three taps from picking a picture to printing it on the fridge.
          </p>
        </div>

        <ol className="mt-12 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="relative rounded-[1.5rem] border border-edge bg-cream/50 px-5 pt-9 pb-6 text-center"
            >
              <span
                aria-hidden
                className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold text-white"
                style={{ background: step.tone }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div
                className="mx-auto grid size-14 place-items-center rounded-2xl text-white"
                style={{ background: step.tone }}
                aria-hidden
              >
                <step.icon className="size-7" strokeWidth={2} />
              </div>
              <h3 className="mt-4 font-display text-lg text-ink">{step.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </Panel>

      {/* ---------------------------- the mood ---------------------------- */}
      <Panel wash="var(--color-blush)" className="text-center">
        <h2 className="font-display text-xl text-ink sm:text-2xl">
          An afternoon that feels lighter{" "}
          <Heart className="inline size-5 fill-coral text-coral" aria-hidden />
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-ink-soft">
          Everything is built to feel quick, friendly and easy on a phone, from the very first tap.
        </p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-3">
          {MOODS.map((mood) => (
            <li
              key={mood.title}
              className="rounded-[1.25rem] border p-4 text-left"
              style={{
                background: `color-mix(in srgb, ${mood.tone} 14%, white)`,
                borderColor: `color-mix(in srgb, ${mood.tone} 34%, white)`,
              }}
            >
              <h3 className="font-display text-base text-ink">
                <span aria-hidden className="mr-1.5">
                  {mood.emoji}
                </span>
                {mood.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{mood.body}</p>
            </li>
          ))}
        </ul>
      </Panel>

      {/* =========================== categories =========================== */}
      {categories.length > 0 && (
        <Panel>
          <span
            aria-hidden
            className="tape -top-3 left-1/2 -ml-11 -rotate-2"
            style={{ ["--tape" as string]: "var(--color-sky)" }}
          />
          <SectionHeading
            eyebrow="Collections"
            band="var(--color-sky)"
            title="Pick a theme"
            subtitle="Every collection, from puppies to planets"
            href="/categories"
          />
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {categories.slice(0, 8).map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                count={category.page_count}
              />
            ))}
          </div>
        </Panel>
      )}

      {/* ========================== closing CTA ========================== */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="relative overflow-hidden rounded-[var(--radius-panel)] bg-coral px-6 py-10 text-center shadow-[var(--shadow-panel)] sm:px-12 sm:py-12">
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-25">
            <div className="absolute -top-16 -left-10 size-48 rounded-full bg-white/50" />
            <div className="absolute -right-12 -bottom-20 size-56 rounded-full bg-white/40" />
          </div>

          <div className="relative">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/25 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white uppercase">
              <Sparkles className="size-3.5" aria-hidden />
              Ready when you are
            </p>
            <h2 className="mt-4 font-display text-[1.9rem] text-white sm:text-[2.6rem]">
              Ready to make something colourful?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-white/85 sm:text-base">
              {site.tagline}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/coloring-pages"
                className="btn-kid bg-white px-7 py-3.5 text-base text-coral shadow-none hover:bg-white hover:text-coral-dark"
              >
                🎨 Start colouring
              </Link>
              <Link
                href="/my-art"
                className="btn-kid border-white/60 bg-transparent px-7 py-3.5 text-base text-white shadow-none hover:bg-white/15"
              >
                <Download className="size-4.5" aria-hidden />
                My sticker book
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ======================== the long version ======================== */}
      <Panel aria-labelledby="overview">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14">
          <div>
            <p className="eyebrow">In a nutshell</p>
            <h2
              id="overview"
              className="mt-4 font-display text-[1.7rem] leading-tight text-ink sm:text-[2.1rem]"
            >
              Everything {site.name}{" "}
              <span className="swoosh" style={{ ["--swoosh" as string]: "var(--color-lilac)" }}>
                offers
              </span>
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-soft sm:text-base">
              A free online coloring book and a printable library in one place - no account, no
              download, nothing to install.
            </p>

            <ul className="mt-6 max-w-md space-y-2.5">
              {[
                { icon: PaintBucket, tone: "var(--color-blush)", label: "Free coloring app" },
                { icon: Printer, tone: "var(--color-butter)", label: "Printable PDF pages" },
                { icon: Share2, tone: "var(--color-mint)", label: "Save and share artwork" },
              ].map(({ icon: Icon, tone, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-3 rounded-full border border-edge bg-cream/50 px-3 py-2.5"
                >
                  <span
                    aria-hidden
                    className="grid size-8 shrink-0 place-items-center rounded-full text-white"
                    style={{ background: tone }}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="text-sm font-semibold text-ink">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4 rounded-[1.5rem] border border-edge bg-cream/50 p-5 text-[0.95rem] leading-[1.8] text-ink/75 sm:space-y-5 sm:p-7 sm:text-base">
            <p className="font-medium text-ink">
              Welcome to a coloring book the whole family can share. {site.name} is a free online
              coloring site where kids and grown-ups can relax and make something bright, right in
              the browser - no downloads, no sign-ups.
            </p>
            <p>
              Every drawing can be coloured on screen with a tap-to-fill bucket, a brush, glitter
              and stickers, or printed as a clean black-and-white PDF for crayons and pencils at
              the kitchen table. Animals, cartoons, vehicles, princesses, dinosaurs, flowers,
              letters and numbers - the library keeps growing.
            </p>
            <p>
              It all works on a phone, a tablet and a desktop. Pick a colour, tap a shape and watch
              the picture come to life. Work is saved on the device, so a half-finished page is
              still there tomorrow.
            </p>
            <p>
              Whether you want a quiet creative break, a rainy-afternoon activity or a stack of
              pages for the classroom,{" "}
              <Link
                href="/coloring-pages"
                className="font-semibold text-coral underline decoration-coral/40 underline-offset-4 hover:decoration-coral"
              >
                start colouring free today
              </Link>
              .
            </p>
          </div>
        </div>
      </Panel>

      {/* ============================== faq ============================== */}
      <Panel aria-labelledby="faq">
        <div className="text-center">
          <p className="eyebrow">Good to know</p>
          <h2
            id="faq"
            className="mt-4 font-display text-[1.9rem] leading-tight text-ink sm:text-[2.4rem]"
          >
            Questions parents ask
          </h2>
        </div>

        <div className="mt-8 space-y-3">
          {FAQS.map(({ q, a }) => (
            <details
              key={q}
              className="group rounded-[1.25rem] border border-edge bg-cream/40 px-4 py-3.5 transition open:bg-white sm:px-5"
            >
              <summary className="flex cursor-pointer list-none items-start gap-3 text-[0.95rem] font-semibold text-ink marker:hidden">
                <ChevronRight
                  className="mt-0.5 size-4 shrink-0 text-coral transition-transform duration-200 group-open:rotate-90"
                  aria-hidden
                />
                {q}
              </summary>
              <p className="mt-3 pl-7 text-sm leading-relaxed text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
      </Panel>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <AdSlot slot="page_bottom" />
      </div>
    </>
  );
}
