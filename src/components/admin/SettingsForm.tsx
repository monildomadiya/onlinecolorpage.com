'use client';

import { useActionState, useState } from 'react';
import { Save } from 'lucide-react';
import { saveSettingsAction } from '@/app/admin/actions/settings';
import type { ActionResult } from '@/app/admin/actions/pages';
import { AdminButton, Alert, Card, Field, Input, Textarea, Toggle } from './ui';
import type { AllSettings } from '@/types/db';

const INITIAL: ActionResult = { ok: false, message: '' };

function SectionForm({
  section,
  title,
  description,
  children,
}: {
  section: string;
  title: string;
  description?: string;
  children: (helpers: { pending: boolean }) => React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(saveSettingsAction, INITIAL);

  return (
    <Card title={title} description={description}>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="section" value={section} />

        {state.message && <Alert tone={state.ok ? 'success' : 'error'}>{state.message}</Alert>}

        {children({ pending })}

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <AdminButton type="submit" loading={pending}>
            {!pending && <Save className="size-4" aria-hidden />}
            Save
          </AdminButton>
        </div>
      </form>
    </Card>
  );
}

export function SiteSettingsForm({ settings }: { settings: AllSettings }) {
  const { site } = settings;

  return (
    <SectionForm section="site" title="Site identity" description="Name, tagline and contact address.">
      {() => (
        <div className="grid gap-4">
          <Field label="Site name" htmlFor="site-name" required>
            <Input id="site-name" name="name" defaultValue={site.name} required maxLength={80} />
          </Field>

          <Field label="Tagline" htmlFor="site-tagline" hint="One short line, used in the footer and hero.">
            <Input id="site-tagline" name="tagline" defaultValue={site.tagline} maxLength={160} />
          </Field>

          <Field
            label="Description"
            htmlFor="site-description"
            hint="Used in the footer and as the fallback meta description."
          >
            <Textarea
              id="site-description"
              name="description"
              defaultValue={site.description}
              rows={3}
              maxLength={400}
            />
          </Field>

          <Field label="Contact email" htmlFor="site-email">
            <Input id="site-email" name="email" type="email" defaultValue={site.email} maxLength={120} />
          </Field>
        </div>
      )}
    </SectionForm>
  );
}

export function HomeSettingsForm({ settings }: { settings: AllSettings }) {
  const { home } = settings;
  const [featured, setFeatured] = useState(home.show_featured);
  const [popular, setPopular] = useState(home.show_popular);
  const [newest, setNewest] = useState(home.show_newest);

  return (
    <SectionForm section="home" title="Home page" description="Hero wording and which sections show.">
      {() => (
        <div className="grid gap-4">
          <input type="hidden" name="show_featured" value={String(featured)} />
          <input type="hidden" name="show_popular" value={String(popular)} />
          <input type="hidden" name="show_newest" value={String(newest)} />

          <Field
            label="Hero headline"
            htmlFor="home-title"
            hint="Each word gets its own colour, so three or four short words work best."
          >
            <Input id="home-title" name="hero_title" defaultValue={home.hero_title} maxLength={80} />
          </Field>

          <Field label="Hero subtitle" htmlFor="home-subtitle">
            <Textarea
              id="home-subtitle"
              name="hero_subtitle"
              defaultValue={home.hero_subtitle}
              rows={2}
              maxLength={240}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Button label" htmlFor="home-cta">
              <Input id="home-cta" name="hero_cta" defaultValue={home.hero_cta} maxLength={40} />
            </Field>

            <Field
              label="Pages in the newest grid"
              htmlFor="home-grid"
              hint="Between 4 and 96."
            >
              <Input
                id="home-grid"
                name="grid_size"
                type="number"
                min={4}
                max={96}
                defaultValue={home.grid_size}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Toggle checked={featured} onChange={setFeatured} label="Top picks section" />
            <Toggle checked={newest} onChange={setNewest} label="Newest section" />
            <Toggle checked={popular} onChange={setPopular} label="Most loved section" />
          </div>
        </div>
      )}
    </SectionForm>
  );
}

export function SeoSettingsForm({ settings }: { settings: AllSettings }) {
  const { seo } = settings;

  return (
    <SectionForm
      section="seo"
      title="SEO & social"
      description="Defaults for pages that have no overrides of their own."
    >
      {() => (
        <div className="grid gap-4">
          <Field label="Default meta title" htmlFor="seo-title" hint="Used on the home page.">
            <Input id="seo-title" name="default_title" defaultValue={seo.default_title} maxLength={120} />
          </Field>

          <Field
            label="Title suffix"
            htmlFor="seo-suffix"
            hint="Appended to every other page's title, e.g. “ | Online Color Page”."
          >
            <Input id="seo-suffix" name="title_suffix" defaultValue={seo.title_suffix} maxLength={60} />
          </Field>

          <Field label="Default meta description" htmlFor="seo-description">
            <Textarea
              id="seo-description"
              name="default_description"
              defaultValue={seo.default_description}
              rows={3}
              maxLength={400}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ['facebook', 'Facebook URL'],
                ['instagram', 'Instagram URL'],
                ['twitter', 'X / Twitter handle or URL'],
                ['pinterest', 'Pinterest URL'],
              ] as const
            ).map(([name, label]) => (
              <Field key={name} label={label} htmlFor={`seo-${name}`}>
                <Input
                  id={`seo-${name}`}
                  name={name}
                  defaultValue={seo[name]}
                  maxLength={200}
                  placeholder="https://"
                />
              </Field>
            ))}
          </div>
        </div>
      )}
    </SectionForm>
  );
}

export function FeatureSettingsForm({ settings }: { settings: AllSettings }) {
  const { features } = settings;
  const [sounds, setSounds] = useState(features.sounds_default_on);
  const [confetti, setConfetti] = useState(features.confetti);
  const [rewards, setRewards] = useState(features.rewards);
  const [guide, setGuide] = useState(features.guide_mode);
  const [downloads, setDownloads] = useState(features.allow_downloads);
  const [maintenance, setMaintenance] = useState(features.maintenance);

  return (
    <SectionForm
      section="features"
      title="Features"
      description="Switch parts of the coloring game and the site on or off."
    >
      {() => (
        <div className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="sounds_default_on" value={String(sounds)} />
          <input type="hidden" name="confetti" value={String(confetti)} />
          <input type="hidden" name="rewards" value={String(rewards)} />
          <input type="hidden" name="guide_mode" value={String(guide)} />
          <input type="hidden" name="allow_downloads" value={String(downloads)} />
          <input type="hidden" name="maintenance" value={String(maintenance)} />

          <Toggle
            checked={sounds}
            onChange={setSounds}
            label="Sound effects on by default"
            hint="Children can always mute them."
          />
          <Toggle
            checked={confetti}
            onChange={setConfetti}
            label="Confetti celebration"
            hint="Shown when a page is finished."
          />
          <Toggle
            checked={rewards}
            onChange={setRewards}
            label="Stars and badges"
            hint="Stored on the child's device only."
          />
          <Toggle
            checked={guide}
            onChange={setGuide}
            label="Guide peek slider"
            hint="Only appears on pages with a guide image."
          />
          <Toggle
            checked={downloads}
            onChange={setDownloads}
            label="Allow downloads"
            hint="Master switch for PNG and PDF buttons."
          />
          <Toggle
            checked={maintenance}
            onChange={setMaintenance}
            label="Maintenance mode"
            hint="Replaces the whole public site with a friendly notice. The admin panel stays open."
          />
        </div>
      )}
    </SectionForm>
  );
}
