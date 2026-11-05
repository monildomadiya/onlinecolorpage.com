import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Brush,
  Download,
  Images,
  PaintBucket,
  Printer,
  Save,
  Tag,
  Undo2,
  ZoomIn,
} from 'lucide-react';
import { getPageBySlug, getRelatedPages } from '@/lib/queries';
import { getSettings } from '@/lib/settings';
import { publicUrl } from '@/lib/r2/public';
import { downloadUrl, fileUrl } from '@/lib/r2/urls';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema, coloringPageSchema } from '@/lib/seo/jsonld';
import { ColoringStudio } from '@/components/coloring/ColoringStudio';
import { JsonLd } from '@/components/site/JsonLd';
import { ViewTracker } from '@/components/site/ViewTracker';
import { PageGrid } from '@/components/site/PageGrid';
import { AdSlot } from '@/components/site/AdSlot';
import { Breadcrumbs, Chip, SectionHeading } from '@/components/ui/Section';
import { ageLabel, formatNumber } from '@/lib/utils';
import { publicEnv } from '@/lib/env';

export const revalidate = 600;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page) {
    return { title: 'Coloring page not found', robots: { index: false, follow: true } };
  }

  return buildPageMetadata(page);
}

const DIFFICULTY_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Tricky' } as const;

export default async function ColorPage({ params }: Props) {
  const { slug } = await params;
  const [page, settings] = await Promise.all([getPageBySlug(slug), getSettings()]);

  if (!page) notFound();

  const related = await getRelatedPages(page, 10);
  const { site, features } = settings;

  const trail = [
    { name: 'Home', path: '/' },
    ...(page.category
      ? [{ name: page.category.name, path: `/category/${page.category.slug}` }]
      : [{ name: 'Coloring pages', path: '/coloring-pages' }]),
    { name: page.title, path: `/color/${page.slug}` },
  ];

  const canDownload = page.allow_download && features.allow_downloads;
  const domain = publicEnv.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return (
    <>
      <JsonLd
        data={[coloringPageSchema(page, publicUrl(page.image_key)), breadcrumbSchema(trail)]}
      />
      <ViewTracker slug={page.slug} />

      <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-6">
        <Breadcrumbs trail={trail} />

        <header className="mb-5">
          <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">
            {page.title}
          </h1>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {page.category && (
              <Chip color={page.category.color ?? '#8b4ff5'}>
                {page.category.emoji} {page.category.name}
              </Chip>
            )}
            <Chip color="#0EA5E9">{DIFFICULTY_LABEL[page.difficulty]}</Chip>
            <Chip color="#F97316">{ageLabel(page.age_min, page.age_max)}</Chip>
            <span className="text-xs font-bold text-ink-soft/70">
              {formatNumber(page.view_count)} views · {formatNumber(page.color_count)} coloured ·{' '}
              {formatNumber(page.download_count)} downloads
            </span>
          </div>
        </header>

        {page.allow_online_color ? (
          <ColoringStudio
            slug={page.slug}
            title={page.title}
            imageUrl={fileUrl(page.image_key)}
            referenceUrl={page.reference_key ? fileUrl(page.reference_key) : null}
            suggestedColors={page.suggested_colors}
            siteName={site.name}
            watermark={domain}
            soundDefault={features.sounds_default_on}
            confettiEnabled={features.confetti}
            rewardsEnabled={features.rewards}
            guideEnabled={features.guide_mode}
            downloadsEnabled={canDownload}
          />
        ) : (
          <div className="card-kid mx-auto max-w-2xl overflow-hidden p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={publicUrl(page.image_key)}
              alt={`${page.title} coloring page`}
              className="mx-auto h-auto w-full rounded-2xl"
            />
            <p className="mt-3 text-center text-sm font-bold text-ink-soft">
              This page is print-only. Download the PDF and colour it with real crayons!
            </p>
          </div>
        )}

        {/* ------------------------ downloads ------------------------ */}
        {canDownload && (
          <section className="no-print mt-8" aria-labelledby="downloads">
            <h2 id="downloads" className="font-display text-xl font-extrabold text-ink">
              Print it at home
            </h2>
            <p className="mt-1 text-sm font-semibold text-ink-soft">
              Grab the blank outline and colour it with real crayons - the PDF is already sized for
              A4 with safe margins.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <a href={downloadUrl(page.slug, 'pdf')} className="btn-kid btn-coral" download>
                <Printer className="size-5" aria-hidden />
                Download printable PDF
              </a>
              <a href={downloadUrl(page.slug, 'png')} className="btn-kid btn-ghost" download>
                <Download className="size-5" aria-hidden />
                Download PNG outline
              </a>
            </div>
          </section>
        )}

        <AdSlot slot="below_canvas" />

        {/* ------------------------ about this page ------------------------ */}
        <section className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="card-kid p-6">
            <h2 className="font-display text-xl font-extrabold text-ink">
              About this coloring page
            </h2>
            <p className="mt-2 text-sm leading-relaxed font-semibold text-ink-soft">
              {page.description ||
                `Colour the ${page.title.toLowerCase()} coloring page right here in your browser, or print it out and use real crayons. Tap the bucket tool and any colour to fill a shape instantly, or switch to a brush for free drawing. When you are happy with it, save a PNG or print it for the fridge.`}
            </p>

            {page.tags.length > 0 && (
              <div className="mt-5">
                <p className="flex items-center gap-1.5 font-display text-[11px] font-extrabold tracking-wide text-ink-soft uppercase">
                  <Tag className="size-3.5" aria-hidden /> Tags
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {page.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/coloring-pages?tag=${encodeURIComponent(tag)}`}
                      className="rounded-full border border-ink/10 bg-white px-3 py-1.5 text-xs font-extrabold text-ink-soft transition hover:bg-cream-deep hover:text-grape-700"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="glass border-mint/55 p-6">
            <h2
              className="band-title text-xl text-ink"
              style={{ ['--band' as string]: 'var(--color-mint)' }}
            >
              Colouring tips
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm font-semibold text-ink-soft">
              {(
                [
                  [
                    PaintBucket,
                    'Tap the bucket, pick a colour, then tap inside a shape to fill it.',
                  ],
                  [Brush, 'Switch to the brush for shading - try the crayon and glitter styles.'],
                  [
                    ZoomIn,
                    'Pinch to zoom in on the tiny bits, then use two fingers to move around.',
                  ],
                  [Undo2, 'Made a mistake? Undo takes back the last step.'],
                  [Save, 'Your work saves itself on this device, so you can finish it later.'],
                ] as const
              ).map(([Icon, text]) => (
                <li key={text} className="flex gap-2.5">
                  <Icon className="mt-0.5 size-4 shrink-0 text-mint-dark" aria-hidden />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        {/* ------------------------ related ------------------------ */}
        {related.length > 0 && (
          <section className="mt-14">
            <SectionHeading
              icon={Images}
              band="var(--color-coral)"
              title="You might also like"
              subtitle={page.category ? `More from ${page.category.name}` : 'More pages to colour'}
              href={page.category ? `/category/${page.category.slug}` : '/coloring-pages'}
            />
            <PageGrid pages={related} priorityCount={0} />
          </section>
        )}

        <AdSlot slot="page_bottom" />
      </div>
    </>
  );
}
