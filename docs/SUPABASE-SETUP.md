# Supabase

Supabase is the database and the admin login. The public site never writes to
it; everything a visitor triggers goes through one `security definer` function
that can only increment counters.

---

## The three clients

| Module | Key | Used by | Why |
| ------ | --- | ------- | --- |
| `lib/supabase/public.ts` | anon | public pages | No cookie access, so listing pages stay statically renderable and cacheable. RLS limits it to published rows. |
| `lib/supabase/server.ts` | anon + cookies | sign-in, admin session | Reads the auth cookie so RLS sees the signed-in user. |
| `lib/supabase/admin.ts` | **service role** | admin reads and every write | Bypasses RLS. Only ever called after `requireStaff()` / `assertStaff()` has verified the caller. |

The service-role key is server-only. It is never in a `NEXT_PUBLIC_` variable
and never reaches the browser.

### Which key goes where

Supabase changed its key format in late 2025. New projects issue
`sb_publishable_…` and `sb_secret_…`; projects made before that issue `anon`
and `service_role` JWTs that start with `eyJ`. The table above calls them "anon"
and "service role" because those are still the *roles* the keys map to — the
Postgres grants and the RLS policies are written against `anon` either way.

Both formats work. The env var names do not change:

| Dashboard (Settings → API Keys) | Env var | Role |
| --- | --- | --- |
| Publishable key / `anon` `public` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` |
| Secret key / `service_role` | `SUPABASE_SERVICE_ROLE_KEY` | `service_role` |

Legacy JWTs are being retired in early 2027, so use the new format on anything
you set up now. `npm run check` reports the key length and will tell you if the
two keys are accidentally identical.

---

## Tables

**`coloring_pages`** — one row per picture. Holds R2 keys (`image_key`,
`thumb_key`, `pdf_key`, `reference_key`), presentation data (difficulty, age
range, tags, suggested palette), four flags (`is_published`, `is_featured`,
`allow_online_color`, `allow_download`), running counters and SEO overrides.

**`categories`** — slug, name, emoji, theme colour, sort order, optional cover.
Deleting one sets its pages' `category_id` to null rather than removing them.

**`profiles`** — 1:1 with `auth.users`, created automatically by a trigger on
sign-up. The `role` column (`viewer` / `editor` / `admin`) is what gates the
admin panel.

**`media`** — an inventory of every R2 object, which powers the media library
and the storage-used figure.

**`settings`** — five JSON rows (`site`, `home`, `seo`, `features`, `ads`) that
drive the site chrome. Each is deep-merged over code defaults, so a missing key
or an empty table still renders a complete site.

**`ad_slots`** — five named placements. Each stores the snippet pasted from
AdSense plus an on/off flag.

**`page_events`** — anonymous event log: page, type, broad device class,
referrer, country code. No IP, no visitor id.

---

## Row Level Security

RLS is on for every table. The anon role can read:

- `coloring_pages` where `is_published`
- `categories` where `is_active`
- `settings` (needed to render the chrome)
- `ad_slots` where `is_active`

and nothing else. There is **no insert, update or delete policy for anon or
authenticated on any table** — all writes go through the service-role client in
server code, after an explicit role check. That keeps the authorisation rules in
one readable place instead of spread across policies.

Staff read their own rows through `public.is_staff()`, a `security definer`
helper that checks `profiles.role`.

---

## Functions

**`track_event(slug, event, path, referrer, country, device)`**
Granted to `anon`. Looks the page up by slug, refuses anything that is not a
published page or a known event type, inserts one `page_events` row and bumps
the matching counter. It can only ever increment — there is no path to writing
arbitrary data.

**`admin_stats()`** — the whole dashboard header in one JSON object instead of a
dozen round trips.

**`events_daily(days)`** — a gap-free daily series via `generate_series`, so the
chart shows zero days rather than skipping them.

**Triggers** — `touch_updated_at` on every mutable table, `stamp_published_at`
to record the first time a page goes live, and `handle_new_user` to create a
profile on sign-up.

---

## Admin accounts

Supabase → **Authentication → Users → Add user** (tick *Auto Confirm User*).

Anyone who signs in gets a `viewer` profile, which cannot see the admin panel —
they land on `/admin/no-access`, which prints the exact SQL to promote them.

Two ways to promote:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

or set `ADMIN_BOOTSTRAP_EMAIL` to that address; it is promoted automatically the
next time it signs in. Afterwards, **Admin → Users** handles roles through the UI.

| Role | Can |
| ---- | --- |
| `viewer` | nothing — signed in but locked out |
| `editor` | upload, edit, publish pages and categories |
| `admin` | everything, plus deletes, settings, ads and roles |

---

## Backups

Supabase takes daily backups on paid plans. On the free tier, export regularly:

```bash
supabase db dump --db-url "$DATABASE_URL" -f backup.sql
```

The database is small (text and counters) — the bulk of the site is in R2, which
Cloudflare replicates for you.

---

## Changing the schema

Add a new numbered file under `supabase/migrations/` (`0003_…`) and run it in the
SQL editor. Keep statements idempotent (`create table if not exists`, `drop
policy if exists` before `create policy`) so re-running a file is always safe.
Then update `src/types/db.ts` to match — the row types are hand-written, not
generated, so they are the one place the TypeScript side and the SQL side have
to be kept in step.
