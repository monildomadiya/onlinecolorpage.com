import { Check, Printer, Sparkles, WandSparkles } from "lucide-react";
import { SearchBox } from "@/components/site/SearchBox";
import { ButtonLink } from "@/components/ui/Button";
import { CrayonMascot } from "@/components/ui/Decor";
import { formatNumber } from "@/lib/utils";

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
  { icon: Check, label: "Always free" },
  { icon: WandSparkles, label: "Color online" },
  { icon: Printer, label: "Print as PDF" },
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

  const stats = [
    totalPages > 0
      ? { value: formatNumber(totalPages), label: "Coloring pages" }
      : null,
    categoryCount > 0
      ? { value: String(categoryCount), label: "Categories" }
      : null,
    { value: "Free", label: "Forever" },
  ].filter(Boolean) as { value: string; label: string }[];

  return (
    <section
      className="relative overflow-hidden bg-cream"
      aria-labelledby="hero-title"
    >
      {/* Flat paper shapes, well behind the text and never in the way of it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-20 -right-16 size-56 rounded-full bg-butter/30 sm:-top-32 sm:-right-24 sm:size-[26rem] sm:bg-butter/45" />
        <div className="absolute -bottom-40 -left-28 size-[22rem] rounded-full bg-sky/35" />
        <div className="absolute top-1/3 -left-10 hidden size-32 rounded-full bg-blush/40 sm:block" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pt-10 pb-14 sm:px-6 sm:pt-14 md:gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20 lg:pb-24">
        {/* ------------------------------ words ------------------------------ */}
        <div className="text-center lg:text-left">
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-medium tracking-wide text-ink-soft uppercase shadow-[var(--shadow-card)]">
            <Sparkles className="size-3.5 text-coral" aria-hidden />
            No sign-up, no app
          </p>

          <h1 id="hero-title" className="mt-5">
            <span className="block font-display text-[clamp(2.25rem,8vw,4.5rem)] leading-[1.05] text-ink">
              {words.map((word, i) => (
                <span
                  key={i}
                  className={i === words.length - 1 ? "text-coral" : undefined}
                >
                  {word}{" "}
                </span>
              ))}
            </span>
            <span className="mt-3 block font-sans text-[clamp(1rem,2.6vw,1.375rem)] leading-snug font-medium text-ink-soft">
              Free printable coloring pages for kids - color them online or
              print them at home
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg lg:mx-0">
            {subtitle}
          </p>

          <div className="mx-auto mt-7 max-w-lg lg:mx-0">
            <SearchBox />
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
            <ButtonLink
              href="/coloring-pages"
              tone="coral"
              size="lg"
              className="justify-center"
            >
              {cta}
            </ButtonLink>
            <ButtonLink
              href="/categories"
              tone="ghost"
              size="lg"
              className="justify-center"
            >
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
        </div>

        {/* ----------------------------- picture ----------------------------- */}
        <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
          <div className="relative rounded-[var(--radius-blob)] bg-white px-6 py-10 text-center shadow-[var(--shadow-card-lift)] sm:px-10 sm:py-12">
            <CrayonMascot className="mx-auto h-40 w-auto animate-bob sm:h-52" />
            <p className="mt-5 font-display text-lg text-ink sm:text-xl">
              Hi, I&apos;m Cray!
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              Pick a colour, tap a shape, and watch it fill.
            </p>

            {/* The palette is decoration, so it is announced as nothing. */}
            <ul aria-hidden className="mt-5 flex justify-center gap-2">
              {[
                "var(--color-coral)",
                "var(--color-butter)",
                "var(--color-mint)",
                "var(--color-sky)",
                "var(--color-lilac)",
              ].map((tone) => (
                <li
                  key={tone}
                  className="size-6 rounded-full"
                  style={{ background: tone }}
                />
              ))}
            </ul>
          </div>

          {/* Small flat labels tucked against the sheet. Hidden on the
              narrowest screens, where they would sit on top of the mascot. */}
          <p
            aria-hidden
            className="absolute -top-3 -left-3 hidden rounded-full bg-mint px-3 py-1.5 text-xs font-semibold text-mint-dark sm:block"
          >
            Tap to fill
          </p>
          <p
            aria-hidden
            className="absolute -right-3 -bottom-3 hidden rounded-full bg-lilac px-3 py-1.5 text-xs font-semibold text-lilac-dark sm:block"
          >
            Print it out
          </p>
        </div>
      </div>

      {/* ------------------------------ counts ------------------------------ */}
      <div className="relative mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:pb-16">
        <dl className="grid grid-cols-3 gap-2 rounded-[var(--radius-card)] bg-white px-4 py-5 shadow-[var(--shadow-card)] sm:gap-4 sm:px-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <dd className="font-display text-xl text-ink sm:text-3xl">
                {stat.value}
              </dd>
              <dt className="mt-1 text-[0.65rem] tracking-wide text-ink-soft uppercase sm:text-xs">
                {stat.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
