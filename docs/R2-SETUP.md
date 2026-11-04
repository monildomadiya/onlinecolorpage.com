# Cloudflare R2

Every image and PDF on the site lives in one R2 bucket. The database only ever
stores **object keys**, never full URLs, so you can change CDN domains later
without touching a single row.

---

## Why R2

- No egress fees — a coloring site is almost all image bandwidth.
- 10 GB storage and 1M Class-A operations a month on the free tier, which is
  thousands of coloring pages.
- Speaks the S3 API, so `@aws-sdk/client-s3` works unmodified.

---

## Creating the bucket

1. Cloudflare dashboard → **R2 → Create bucket**. Name it `onlinecolorpage`.
   Location *Automatic* is right unless your audience is in one region.
2. **Manage R2 API Tokens → Create Account API token**
   - Permissions: **Object Read & Write** — the app only ever reads, writes and
     lists objects; it never creates or deletes buckets
   - Scope it to that single bucket
   - TTL **Forever**, and leave IP filtering empty (Azure outbound addresses
     change)
   - Copy the **Access Key ID** and **Secret Access Key** — the secret is shown
     once

   Pick the *Account* token, not the *User* one. A user token is tied to the
   person who made it and goes inactive if they leave the account, which would
   take the site's images down with it.
3. Your **Account ID** is the hex string in the dashboard URL
   (`dash.cloudflare.com/<account-id>/r2`).

```
R2_ACCOUNT_ID=0123456789abcdef0123456789abcdef
R2_ACCESS_KEY_ID=…
R2_SECRET_ACCESS_KEY=…
R2_BUCKET=onlinecolorpage
```

The endpoint is derived automatically as
`https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com` — you never set it yourself.

---

## Key layout

```
pages/2026/11/cute-baby-elephant-a3f9k2.png    line-art master (PNG, ≤2000px, white background)
thumbs/2026/11/cute-baby-elephant-b8d1m4.webp  600px grid thumbnail
pdfs/2026/11/cute-baby-elephant-c7e2n9.pdf     A4 printable
refs/2026/11/cute-baby-elephant-d4f8p1.webp    optional pre-coloured guide
covers/2026/11/animals-e9a3q7.webp             category cover
```

Year/month folders keep any single prefix small, and the six-character random
suffix means a re-upload never collides with a cached old file. Because every
key is unique, objects are served with `Cache-Control: immutable`.

---

## Serving files

Two paths, chosen per use:

**`/api/file/<key>` — always same-origin.**
Used for the line-art master. The coloring canvas calls `getImageData()` on it
for flood fill and `toBlob()` for PNG export; a cross-origin image would taint
the canvas and both would throw. Serving it from our own origin removes the
problem entirely, and the response carries a one-year immutable cache header so
it is only fetched once per visitor.

**`R2_PUBLIC_BASE_URL/<key>` — straight from Cloudflare.**
Used for thumbnails, category covers, OG images and PDFs, which are only ever
displayed or downloaded. Leave the variable empty and these fall back to the
same-origin proxy — correct, just more bandwidth through your server.

### Setting up a public base (recommended)

1. R2 → your bucket → **Settings → Public access → Custom domain**
2. Add `cdn.onlinecolorpage.com` (Cloudflare adds the DNS record if the zone is
   on your account)
3. Set `R2_PUBLIC_BASE_URL=https://cdn.onlinecolorpage.com` and rebuild — it is
   a build-time value because `next.config.ts` turns it into an allowed image
   host.

The `r2.dev` development subdomain also works and is already allowed in
`next.config.ts`, but it is rate-limited and not meant for production.

### CORS

Not needed. Nothing reads pixels from the CDN domain — the canvas only ever
loads the master through `/api/file/*`. If you later add something that does,
add a rule on the bucket allowing `GET` from your site origin.

---

## What the upload pipeline does

`POST /api/admin/upload` with `mode=page`:

1. `sharp` fixes EXIF rotation, caps the longest side at 2000px, flattens onto
   white and writes a palette PNG.
2. A 600px WebP thumbnail is rendered from that master.
3. `pdf-lib` embeds the master in an A4 page with 36pt margins, a title and a
   small site credit, rotating to landscape when the artwork is clearly wide.
4. All three go to R2 in parallel, then one row lands in `coloring_pages` and
   one row per file in `media`.

Other modes: `reference` (guide image — also derives a suggested palette from
the dominant colours), `cover` (category cover) and `pdf` (replace the generated
PDF with a hand-made one).

If PDF generation fails the upload still succeeds; the download route builds and
caches the PDF the first time somebody asks for it.

---

## Housekeeping

- **Admin → Media library** lists everything with size, type and date. A file
  still referenced by a coloring page cannot be deleted there — delete or
  re-upload the page instead.
- Deleting a page removes its master, thumbnail, PDF and guide from R2 as well.
- **Admin → Dashboard** shows total objects and bytes stored, summed from the
  `media` table.

Inspect the bucket directly with any S3 tool:

```bash
aws s3 ls s3://onlinecolorpage/pages/ --recursive --endpoint-url https://<account-id>.r2.cloudflarestorage.com
```
