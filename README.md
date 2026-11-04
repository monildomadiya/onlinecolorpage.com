# onlinecolorpage.com

Free coloring pages for kids — colour them online in the browser, download a
PNG, or print the A4 PDF. Built as a game first: big chunky buttons, tap-to-fill,
sound effects, stickers, confetti and a badge collection.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Supabase
(Postgres + Auth) · Cloudflare R2 (S3 API) · Docker → Azure App Service

---

## What it does

### For children

- **Tap-to-fill colouring.** A scanline flood fill bounded by the artwork's own
  outlines. Hairline gaps in the line art are closed automatically, so colour
  does not leak into the next shape.
- **Five brushes** — marker, crayon, rainbow, glitter and a stamp trail — in
  five sizes, plus an eraser and an eyedropper.
- **Stickers**, pinch-to-zoom, two-finger pan, 24 steps of undo/redo.
- **Work saves itself** to the device after every change, so a half-finished
  picture is still there tomorrow.
- **Stars, badges and streaks** for finishing pages, kept in a private
  "sticker book". Nothing is uploaded and no account exists.
- **Save a PNG, print, or share** through the phone's own share sheet.

### For the site owner

- **Bulk upload.** Drop in a folder of line art; each file is normalised,
  thumbnailed, turned into a print-ready A4 PDF, pushed to R2 and published.
- **Smart admin panel** — dashboard with charts, searchable page list with bulk
  publish/feature/delete, category manager, media library, first-party
  analytics, AdSense slots, site settings and role management.
- **Built-in analytics.** Views, colourings, downloads, prints, device and
  country splits, straight out of your own database.
- **SEO throughout** — per-page metadata, JSON-LD (`CreativeWork`,
  `CollectionPage`, `BreadcrumbList`, `FAQPage`), a dynamic sitemap, generated
  OG images and a web manifest.
- **AdSense-ready** with five placements you control from the panel.

---

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

<http://localhost:3000> runs with empty env vars and tells you what is missing.
<http://localhost:3000/demo> already plays the full coloring game on a sample
picture, before any database or storage exists.

Then follow **[docs/SETUP.md](./docs/SETUP.md)** to connect Supabase and R2 and
create your admin account. `npm run check` verifies the whole setup and names
anything still missing.

---

## Documentation

| | |
| --- | --- |
| [docs/SETUP.md](./docs/SETUP.md) | From clean checkout to first uploaded page |
| [docs/SUPABASE-SETUP.md](./docs/SUPABASE-SETUP.md) | Schema, RLS, functions, admin roles |
| [docs/R2-SETUP.md](./docs/R2-SETUP.md) | Bucket, keys, CDN domain, upload pipeline |
| [docs/AZURE-DEPLOY.md](./docs/AZURE-DEPLOY.md) | Container deploy, custom domain, CI |

---

## Two design decisions worth knowing

**The line-art master is always served from our own origin** (`/api/file/<key>`),
even when a CDN domain is configured. The canvas calls `getImageData()` for
flood fill and `toBlob()` for PNG export; a cross-origin image would taint the
canvas and break both. Thumbnails, covers and PDFs — which are only displayed —
do go straight to the CDN.

**All writes go through the service-role key behind an explicit role check.**
RLS gives the anon role read access to published rows and nothing more. There is
no insert/update/delete policy anywhere, so authorisation lives in one readable
place (`lib/auth.ts`) rather than spread across a dozen policies.

---

## Commands

```bash
npm run dev         # dev server
npm run build       # production build (standalone output for Docker)
npm run typecheck   # tsc --noEmit
npm run check       # verify Supabase + R2 credentials and schema
npm run secret      # paste a secret into .env.local without echoing it
npm run admin       # create the first admin account
npm run azure:settings  # copy the run-time env to the Azure Web App
npm run lint        # eslint
npm run db:sql      # print every migration, ready to paste into Supabase
npm run icons       # regenerate PNG app icons from public/favicon.svg
```

---

## Licence

The code is yours to use for this site. Coloring page artwork you upload is
governed by whatever licence it came with — see `/terms` on the running site for
the wording shown to visitors.
