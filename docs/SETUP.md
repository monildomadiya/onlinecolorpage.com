# Setup — onlinecolorpage.com

Getting from a clean checkout to a working site. Roughly 20 minutes.

The three pieces you need accounts for:

| Piece                | What it holds                                  | Free tier |
| -------------------- | ---------------------------------------------- | --------- |
| **Supabase**         | Postgres database + admin login                | Yes       |
| **Cloudflare R2**    | Every image and PDF                            | 10 GB     |
| **Azure App Service**| Runs the Next.js app                           | Paid      |

---

## 1. Install and run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

At any point, `npm run check` tells you exactly what is still missing and
how to fix it — it verifies the Supabase connection, that the migrations ran,
that the seed data landed, and that R2 accepts a read, a write and a delete.

The site boots at <http://localhost:3000> even with empty env vars — the home
page shows an "Almost ready!" panel listing what is still missing, and
<http://localhost:3000/demo> already runs the full coloring game on a sample
picture.

---

## 2. Supabase

1. Create a project at <https://supabase.com/dashboard>. Pick the region
   closest to your visitors — it is permanent.
2. **Project Settings → API Keys** gives you the values for `.env.local`:
   - Project URL (**Settings → API**) → `NEXT_PUBLIC_SUPABASE_URL`
   - Publishable key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Secret key → `SUPABASE_SERVICE_ROLE_KEY` *(server only — never put this in
     a `NEXT_PUBLIC_` variable)*

   Projects created from late 2025 issue `sb_publishable_…` and `sb_secret_…`
   keys; older ones issue `anon` and `service_role` JWTs beginning `eyJ`. Both
   work here and the variable names are the same either way — Supabase is
   retiring the legacy JWTs in early 2027, so prefer the new ones.

   The secret key is the one value you should not paste into a shell command or
   leave on screen. `npm run secret` prompts for it without echoing, checks it
   has the right shape, and writes it into `.env.local` for you:

   ```bash
   npm run secret SUPABASE_SERVICE_ROLE_KEY
   ```
3. Open the **SQL Editor** and run the two migrations, in order:
   - `supabase/migrations/0001_init.sql` — tables, indexes, RLS, functions
   - `supabase/migrations/0002_seed.sql` — default settings, ad slots, 12 starter categories

   `npm run db:sql` prints both files joined together if you would rather paste
   once. With the Supabase CLI, `supabase db push` reads the same folder.

See [SUPABASE-SETUP.md](./SUPABASE-SETUP.md) for what each table does.

---

## 3. Cloudflare R2

1. In the Cloudflare dashboard open **R2 → Create bucket** (e.g. `onlinecolorpage`).
2. **Manage R2 API Tokens → Create API token**, with *Object Read & Write* on
   that bucket. Copy the Access Key ID and Secret.
3. Fill in `.env.local`:

   ```
   R2_ACCOUNT_ID=…          # the hex id in your dashboard URL
   R2_ACCESS_KEY_ID=…
   R2_SECRET_ACCESS_KEY=…
   R2_BUCKET=onlinecolorpage
   R2_PUBLIC_BASE_URL=      # optional, see below
   ```

`R2_PUBLIC_BASE_URL` is optional. Leave it empty and files stream through
`/api/file/<key>` on your own domain — correct but it uses your server's
bandwidth. Set it to a custom domain (`https://cdn.onlinecolorpage.com`) and
thumbnails, covers and PDFs come straight from Cloudflare's edge instead.

> The **line-art master is always served from your own origin**, even with a CDN
> configured. The coloring canvas has to read its pixels, and a cross-origin
> image would taint the canvas and break both the fill tool and PNG export.

More detail in [R2-SETUP.md](./R2-SETUP.md).

---

## 4. Create your admin account

```bash
npm run admin
```

It asks for the email (defaulting to `ADMIN_BOOTSTRAP_EMAIL`) and a password,
which is not echoed, then creates the Supabase Auth user with its email already
confirmed and sets its profile role to `admin`. Sign in at
<http://localhost:3000/admin/login>.

By hand instead: Supabase → **Authentication → Users → Add user**, tick *Auto
Confirm User*, put that address in `.env.local` as `ADMIN_BOOTSTRAP_EMAIL`, and
sign in — the bootstrap address is promoted to `admin` on first sign-in.

Any other address that signs in becomes a `viewer` (no access) until you promote
it from **Admin → Users**. To do it by hand:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

Roles: `viewer` (locked out) → `editor` (upload, edit, publish) → `admin`
(everything, including deletes, settings, ads and roles).

---

## 5. Add your first coloring pages

**Admin → Bulk upload**, drop in a folder of line art, set the shared category
and tags, press *Upload all*. For each file the server:

1. flattens it onto white, caps it at 2000px and saves a PNG master;
2. renders a 600px WebP thumbnail;
3. builds an A4 print PDF with margins and a footer credit;
4. stores all three in R2 and writes the row to Supabase.

**Line art works best when it is clean black on white.** The fill tool treats
anything darker than about 60% grey as an outline, so heavy grey shading will
block fills. Transparent PNGs are fine — they get flattened onto white.

---

## 6. Deploy

See [AZURE-DEPLOY.md](./AZURE-DEPLOY.md).

---

## Project layout

```
src/
  app/
    (site)/            public pages — home, listings, the coloring page, static text
    admin/
      (dash)/          the admin panel (auth-gated by its layout)
      login/           sign-in, outside the gate
      actions/         server actions: pages, categories, settings, auth
    api/
      file/[...key]    streams an R2 object through our origin
      download/…       PNG / PDF download, generates a missing PDF on the fly
      admin/upload     all admin file uploads (sharp + pdf-lib + R2 + DB)
      track            anonymous event beacon
      health           liveness probe for Docker and Azure
  components/
    coloring/          the coloring game (engine, hook, toolbar, palette, stickers)
    site/              public chrome and cards
    admin/             admin shell, tables, forms, charts
    ui/                shared primitives
  lib/
    supabase/          three clients: public (anon), server (cookies), admin (service role)
    r2/                S3 client, key builder, URL helpers
    images.ts          sharp pipelines
    pdf.ts             pdf-lib A4 builder
    queries.ts         public reads
    admin/queries.ts   admin reads
    seo/               metadata + JSON-LD
supabase/migrations/   the schema
```

## Everyday commands

```bash
npm run dev         # dev server
npm run build       # production build
npm run typecheck   # tsc --noEmit
npm run check       # verify Supabase + R2 are wired up correctly
npm run secret      # paste a secret into .env.local without echoing it
npm run admin       # create the first admin account
npm run lint        # eslint
npm run db:sql      # print all migrations
npm run icons       # regenerate PNG icons from public/favicon.svg
```
