import {
  Brush,
  Check,
  Eraser,
  Heart,
  PaintBucket,
  Pipette,
  Printer,
  Sparkles,
  Stamp,
  Undo2,
  WandSparkles,
} from 'lucide-react';
import { SearchBox } from '@/components/site/SearchBox';
import { ButtonLink } from '@/components/ui/Button';
import { CrayonMascot } from '@/components/ui/Decor';
import { formatNumber } from '@/lib/utils';

/**
 * The homepage hero.
 *
 * Laid out as one column up to the large breakpoint and two columns above it.
 * The single-column form is the real one: phones and tablets both get it, and
 * it is centred, so the break at `lg` only has to move the text left rather
 * than rearrange it. Sizes come from clamp() rather than a breakpoint ladder,
 * which is what keeps the headline sensible across the whole tablet range
 * instead of jumping at 640px and again at 1024px.
 *
 * For search, the h1 carries the words someone would actually type - free,
 * printable, coloring pages, kids - as a visible second line rather than the
 * brand slogan alone, which says nothing about what the page offers. The
 * slogan stays on top because it is what the admin panel controls.
 */

const PROMISES = [
  { icon: Check, label: 'Always free' },
  { icon: WandSparkles, label: 'Color online' },
  { icon: Printer, label: 'Print as PDF' },
];

/** Decorative tool rail down the left of the app mock. */
const TOOLS = [Brush, PaintBucket, Eraser, Pipette, Stamp, Undo2];

const SWATCHES = [
  '#e04d6e',
  '#ff7fa3',
  '#ffa36a',
  '#ffc94d',
  '#a8d65e',
  '#7cc9a5',
  '#59beeb',
  '#a98bea',
];

export function HomeHero({
  title,
  subtitle,
  cta,
  totalPages,
  categoryCount,
}: {
  title: string;
  subtitle: string;
  cta: string;
  totalPages: number;
  categoryCount: number;
}) {
  const words = title.trim().split(/\s+/);
  const lead = words.slice(0, -1).join(' ');
  const last = words.at(-1) ?? '';

  const stats = [
    totalPages > 0
      ? { icon: '🖍️', value: formatNumber(totalPages), label: 'coloring pages' }
      : null,
    categoryCount > 0
      ? { icon: '🧺', value: String(categoryCount), label: 'themes to explore' }
      : null,
    { icon: '💗', value: 'Free', label: 'forever, no sign-up' },
  ].filter(Boolean) as { icon: string; value: string; label: string }[];

  return (
    <section className="relative overflow-hidden" aria-labelledby="hero-title">
      {/* Soft paper shapes, well behind the text and never in the way of it. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-20 size-72 rounded-full bg-butter/25 sm:size-[26rem]" />
        <div className="absolute -bottom-40 -left-28 size-[22rem] rounded-full bg-peach/15" />
        <div className="absolute top-1/3 -left-10 hidden size-32 rounded-full bg-blush/15 sm:block" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pt-10 pb-10 sm:px-6 sm:pt-14 md:gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:pt-16 lg:pb-16">
        {/* ------------------------------ words ------------------------------ */}
        <div className="text-center lg:text-left">
          <p className="eyebrow">
            <Heart className="size-3.5 fill-current" aria-hidden />
            Your coloring time starts here
          </p>

          <h1 id="hero-title" className="mt-5">
            <span className="block font-display text-[clamp(2.4rem,8vw,4.25rem)] leading-[1.04] text-ink">
              {lead && <>{lead} </>}
              <span className="swoosh text-coral">{last}</span>
            </span>
            <span className="mt-4 block font-sans text-[clamp(0.95rem,2.4vw,1.2rem)] leading-snug font-medium text-ink-soft">
              Free printable coloring pages for kids &mdash; color them online or print them at
              home
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-soft lg:mx-0">
            {subtitle}
          </p>

          <div className="mx-auto mt-7 max-w-lg lg:mx-0">
            <SearchBox />
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
            <ButtonLink href="/coloring-pages" tone="coral" size="lg" className="justify-center">
              🎨 {cta}
            </ButtonLink>
            <ButtonLink href="/categories" tone="ghost" size="lg" className="justify-center">
              Browse categories
            </ButtonLink>
          </div>

          <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-ink-soft lg:justify-start">
            {PROMISES.map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-1.5">
                <Icon className="size-4 text-coral" aria-hidden />
                {label}
              </li>
            ))}
          </ul>

          {/* ---------------------------- counts ---------------------------- */}
          <dl className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-4 lg:justify-start">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="grid size-10 place-items-center rounded-2xl border border-edge bg-white text-lg shadow-[var(--shadow-card)]"
                >
                  {stat.icon}
                </span>
                <div className="text-left">
                  <dd className="font-display text-lg leading-none text-ink">{stat.value}</dd>
                  <dt className="mt-1 text-xs text-ink-soft">{stat.label}</dt>
                </div>
              </div>
            ))}
          </dl>
        </div>

        {/* ---------------------------- app mock ---------------------------- */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <span aria-hidden className="tape -top-3 left-10 -rotate-6" style={{ ['--tape' as string]: 'var(--color-mint)' }} />
          <span
            aria-hidden
            className="tape -right-4 bottom-16 hidden rotate-12 sm:block"
            style={{ ['--tape' as string]: 'var(--color-lilac)' }}
          />

          <div className="panel overflow-hidden p-3 sm:p-4">
            <div className="flex gap-3">
              {/* tool rail */}
              <ul aria-hidden className="flex shrink-0 flex-col gap-2">
                {TOOLS.map((Tool, i) => (
                  <li
                    key={i}
                    className={`grid size-9 place-items-center rounded-xl ${
                      i === 1 ? 'bg-coral text-white' : 'bg-cream text-ink-soft'
                    }`}
                  >
                    <Tool className="size-4" />
                  </li>
                ))}
              </ul>

              {/* canvas */}
              <div className="relative flex-1 rounded-[1.25rem] border border-edge bg-white p-4">
                <span
                  aria-hidden
                  className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-1 text-[0.65rem] font-semibold text-ink-soft"
                >
                  <Sparkles className="size-3 text-coral" />
                  Tap to fill
                </span>
                <CrayonMascot className="mx-auto h-44 w-auto animate-bob sm:h-56" />
                <p className="mt-3 text-center font-display text-lg text-ink">Hi, I&apos;m Cray!</p>
                <p className="mt-1 text-center text-sm text-ink-soft">
                  Pick a colour, tap a shape, and watch it fill.
                </p>
              </div>
            </div>

            {/* palette tray */}
            <ul aria-hidden className="mt-3 flex flex-wrap justify-center gap-2 rounded-full bg-cream px-4 py-3">
              {SWATCHES.map((tone) => (
                <li
                  key={tone}
                  className="size-6 rounded-full ring-2 ring-white"
                  style={{ background: tone }}
                />
              ))}
            </ul>
          </div>

          {/* Small flat labels tucked against the sheet. Hidden on the
              narrowest screens, where they would sit on top of the mock. */}
          <p
            aria-hidden
            className="absolute -top-3 -right-2 hidden rounded-full bg-butter px-3 py-1.5 text-xs font-semibold text-butter-dark shadow-[var(--shadow-card)] sm:block"
          >
            No app needed
          </p>
          <p
            aria-hidden
            className="absolute -bottom-4 left-4 hidden rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-[var(--shadow-card-lift)] sm:block"
          >
            🖨️ Print it out
          </p>
        </div>
      </div>
    </section>
  );
}
