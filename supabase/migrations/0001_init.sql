-- ============================================================================
--  onlinecolorpage.com - initial schema
--  Run in the Supabase SQL Editor, or with `npm run db:migrate`.
--  Safe to re-run: every statement is idempotent.
-- ============================================================================

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
--  helpers
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $fn$
begin
  new.updated_at = now();
  return new;
end $fn$;

-- ---------------------------------------------------------------------------
--  profiles  (admin / editor accounts, 1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  full_name    text,
  avatar_url   text,
  role         text not null default 'viewer' check (role in ('admin', 'editor', 'viewer')),
  last_seen_at timestamptz,
  created_at   timestamptz not null default now()
);

-- Any signed-in user gets a 'viewer' profile automatically; promote to admin
-- from the admin panel (Users page) or with the SQL at the bottom of this file.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $fn$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- true when the calling JWT belongs to an admin or editor
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'editor')
  );
$fn$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$fn$;

-- ---------------------------------------------------------------------------
--  categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null,
  description     text,
  emoji           text default '🎨',
  color           text default '#8B5CF6',
  cover_key       text,
  sort_order      integer not null default 0,
  is_active       boolean not null default true,
  seo_title       text,
  seo_description text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists categories_active_sort_idx
  on public.categories (is_active, sort_order, name);

drop trigger if exists categories_touch on public.categories;
create trigger categories_touch before update on public.categories
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
--  coloring_pages
-- ---------------------------------------------------------------------------
create table if not exists public.coloring_pages (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  description text,
  category_id uuid references public.categories (id) on delete set null,

  -- Cloudflare R2 object keys (never full URLs - the public base can change)
  image_key     text not null,              -- line-art master (png/jpg/svg)
  thumb_key     text,                       -- 600px webp grid thumbnail
  pdf_key       text,                       -- A4 printable pdf
  reference_key text,                        -- optional pre-coloured guide image

  width     integer,
  height    integer,
  file_size integer,

  difficulty       text not null default 'easy' check (difficulty in ('easy', 'medium', 'hard')),
  age_min          smallint not null default 3,
  age_max          smallint not null default 12,
  tags             text[] not null default '{}',
  suggested_colors text[] not null default '{}',

  is_published       boolean not null default false,
  is_featured        boolean not null default false,
  allow_online_color boolean not null default true,
  allow_download     boolean not null default true,

  view_count     bigint not null default 0,
  download_count bigint not null default 0,
  color_count    bigint not null default 0,
  like_count     bigint not null default 0,

  seo_title       text,
  seo_description text,

  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists pages_published_idx
  on public.coloring_pages (is_published, published_at desc nulls last);
create index if not exists pages_category_idx
  on public.coloring_pages (category_id, is_published);
create index if not exists pages_featured_idx
  on public.coloring_pages (is_featured, is_published) where is_featured;
create index if not exists pages_tags_idx
  on public.coloring_pages using gin (tags);
create index if not exists pages_title_trgm_idx
  on public.coloring_pages using gin (title gin_trgm_ops);
create index if not exists pages_popular_idx
  on public.coloring_pages (view_count desc) where is_published;

drop trigger if exists pages_touch on public.coloring_pages;
create trigger pages_touch before update on public.coloring_pages
  for each row execute function public.touch_updated_at();

-- stamp published_at the first time a page goes live
create or replace function public.stamp_published_at()
returns trigger language plpgsql as $fn$
begin
  if new.is_published and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end $fn$;

drop trigger if exists pages_stamp_published on public.coloring_pages;
create trigger pages_stamp_published before insert or update on public.coloring_pages
  for each row execute function public.stamp_published_at();

-- ---------------------------------------------------------------------------
--  media  (R2 object inventory, powers the admin Media Library)
-- ---------------------------------------------------------------------------
create table if not exists public.media (
  id            uuid primary key default gen_random_uuid(),
  key           text not null unique,
  kind          text not null default 'image' check (kind in ('image', 'thumb', 'pdf', 'other')),
  mime_type     text,
  size_bytes    bigint,
  width         integer,
  height        integer,
  original_name text,
  page_id       uuid references public.coloring_pages (id) on delete set null,
  uploaded_by   uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists media_kind_idx on public.media (kind, created_at desc);
create index if not exists media_page_idx on public.media (page_id);

-- ---------------------------------------------------------------------------
--  settings  (one json blob per key, drives the whole site chrome)
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists settings_touch on public.settings;
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
--  ad_slots
-- ---------------------------------------------------------------------------
create table if not exists public.ad_slots (
  id         uuid primary key default gen_random_uuid(),
  slot_key   text not null unique,
  name       text not null,
  code       text,
  is_active  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists ad_slots_touch on public.ad_slots;
create trigger ad_slots_touch before update on public.ad_slots
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
--  page_events  (lightweight first-party analytics)
-- ---------------------------------------------------------------------------
create table if not exists public.page_events (
  id         bigserial primary key,
  page_id    uuid references public.coloring_pages (id) on delete cascade,
  event_type text not null check (event_type in
    ('view', 'download_png', 'download_pdf', 'print', 'color_start', 'color_finish', 'like')),
  path       text,
  referrer   text,
  country    text,
  device     text check (device in ('mobile', 'tablet', 'desktop', 'unknown')),
  created_at timestamptz not null default now()
);

create index if not exists events_created_idx on public.page_events (created_at desc);
create index if not exists events_page_idx    on public.page_events (page_id, event_type);
create index if not exists events_type_idx    on public.page_events (event_type, created_at desc);

-- ---------------------------------------------------------------------------
--  RPC: record an event and bump the matching counter in one round trip.
--  Callable by anon (security definer) but can only ever increment.
-- ---------------------------------------------------------------------------
create or replace function public.track_event(
  p_slug     text,
  p_event    text,
  p_path     text default null,
  p_referrer text default null,
  p_country  text default null,
  p_device   text default null
) returns void language plpgsql security definer set search_path = public as $fn$
declare
  v_page uuid;
begin
  if p_event not in ('view', 'download_png', 'download_pdf', 'print',
                     'color_start', 'color_finish', 'like') then
    return;
  end if;

  select id into v_page
    from public.coloring_pages
   where slug = p_slug and is_published
   limit 1;

  if v_page is null then
    return;
  end if;

  insert into public.page_events (page_id, event_type, path, referrer, country, device)
  values (v_page, p_event, left(p_path, 500), left(p_referrer, 500), left(p_country, 8),
          coalesce(nullif(p_device, ''), 'unknown'));

  update public.coloring_pages set
    view_count     = view_count     + (case when p_event = 'view' then 1 else 0 end),
    download_count = download_count + (case when p_event in ('download_png', 'download_pdf') then 1 else 0 end),
    color_count    = color_count    + (case when p_event = 'color_start' then 1 else 0 end),
    like_count     = like_count     + (case when p_event = 'like' then 1 else 0 end)
  where id = v_page;
end $fn$;

grant execute on function public.track_event(text, text, text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
--  RPC: admin dashboard aggregates (one call instead of a dozen)
-- ---------------------------------------------------------------------------
create or replace function public.admin_stats()
returns jsonb language sql security definer set search_path = public as $fn$
  select jsonb_build_object(
    'pages_total',      (select count(*) from coloring_pages),
    'pages_published',  (select count(*) from coloring_pages where is_published),
    'pages_draft',      (select count(*) from coloring_pages where not is_published),
    'categories_total', (select count(*) from categories),
    'media_total',      (select count(*) from media),
    'storage_bytes',    (select coalesce(sum(size_bytes), 0) from media),
    'views_total',      (select coalesce(sum(view_count), 0) from coloring_pages),
    'downloads_total',  (select coalesce(sum(download_count), 0) from coloring_pages),
    'colorings_total',  (select coalesce(sum(color_count), 0) from coloring_pages),
    'views_7d',         (select count(*) from page_events
                          where event_type = 'view' and created_at > now() - interval '7 days'),
    'downloads_7d',     (select count(*) from page_events
                          where event_type in ('download_png', 'download_pdf')
                            and created_at > now() - interval '7 days'),
    'colorings_7d',     (select count(*) from page_events
                          where event_type = 'color_start' and created_at > now() - interval '7 days')
  );
$fn$;

-- daily time series for the dashboard chart
create or replace function public.events_daily(p_days integer default 30)
returns table (day date, views bigint, downloads bigint, colorings bigint)
language sql security definer set search_path = public as $fn$
  select d::date as day,
         count(e.id) filter (where e.event_type = 'view')                            as views,
         count(e.id) filter (where e.event_type in ('download_png', 'download_pdf')) as downloads,
         count(e.id) filter (where e.event_type = 'color_start')                     as colorings
    from generate_series(
           (current_date - (greatest(p_days, 1) - 1) * interval '1 day'),
           current_date,
           interval '1 day'
         ) d
    left join public.page_events e
           on e.created_at >= d and e.created_at < d + interval '1 day'
   group by d
   order by d;
$fn$;

grant execute on function public.admin_stats() to authenticated;
grant execute on function public.events_daily(integer) to authenticated;

-- ---------------------------------------------------------------------------
--  Row Level Security
--  Public (anon) reads published content only.
--  All writes happen server-side with the service-role key, which bypasses RLS.
-- ---------------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.categories     enable row level security;
alter table public.coloring_pages enable row level security;
alter table public.media          enable row level security;
alter table public.settings       enable row level security;
alter table public.ad_slots       enable row level security;
alter table public.page_events    enable row level security;

drop policy if exists profiles_self_read  on public.profiles;
drop policy if exists profiles_staff_read on public.profiles;
create policy profiles_self_read  on public.profiles for select using (id = auth.uid());
create policy profiles_staff_read on public.profiles for select using (public.is_staff());

drop policy if exists categories_public_read on public.categories;
drop policy if exists categories_staff_read  on public.categories;
create policy categories_public_read on public.categories for select using (is_active);
create policy categories_staff_read  on public.categories for select using (public.is_staff());

drop policy if exists pages_public_read on public.coloring_pages;
drop policy if exists pages_staff_read  on public.coloring_pages;
create policy pages_public_read on public.coloring_pages for select using (is_published);
create policy pages_staff_read  on public.coloring_pages for select using (public.is_staff());

drop policy if exists media_staff_read on public.media;
create policy media_staff_read on public.media for select using (public.is_staff());

drop policy if exists settings_public_read on public.settings;
create policy settings_public_read on public.settings for select using (true);

drop policy if exists ads_public_read on public.ad_slots;
create policy ads_public_read on public.ad_slots for select using (is_active);

drop policy if exists events_staff_read on public.page_events;
create policy events_staff_read on public.page_events for select using (public.is_staff());

-- ---------------------------------------------------------------------------
--  After creating your first Auth user, promote it:
--    update public.profiles set role = 'admin' where email = 'you@example.com';
-- ---------------------------------------------------------------------------
