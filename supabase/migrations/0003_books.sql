-- ============================================================================
--  onlinecolorpage.com - coloring books
--  A book is an admin-curated, ordered set of existing coloring pages that
--  downloads as one multi-page PDF. Run after 0002_seed.sql. Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
--  books
-- ---------------------------------------------------------------------------
create table if not exists public.books (
  id       uuid primary key default gen_random_uuid(),
  slug     text not null unique,
  title    text not null,
  subtitle text,

  -- Plain-text summary for cards and meta descriptions.
  description text,
  -- Sanitised rich text from the admin editor, rendered through <RichText />.
  body_html   text,

  -- Cloudflare R2 object keys (never full URLs - the public base can change)
  cover_key text,
  -- The built multi-page PDF, cached after the first download.
  pdf_key   text,

  -- Cleared whenever the book or its page list changes, so the next download
  -- rebuilds rather than serving yesterday's selection.
  pdf_built_at timestamptz,
  pdf_pages    integer,

  include_cover_page boolean not null default true,

  is_published   boolean not null default false,
  is_featured    boolean not null default false,
  allow_download boolean not null default true,

  download_count bigint not null default 0,

  seo_title       text,
  seo_description text,

  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists books_published_idx
  on public.books (is_published, published_at desc nulls last);
create index if not exists books_featured_idx
  on public.books (is_featured, is_published) where is_featured;

drop trigger if exists books_touch on public.books;
create trigger books_touch before update on public.books
  for each row execute function public.touch_updated_at();

-- Same first-publish stamp the coloring pages use.
drop trigger if exists books_stamp_published on public.books;
create trigger books_stamp_published before insert or update on public.books
  for each row execute function public.stamp_published_at();

-- ---------------------------------------------------------------------------
--  book_pages  (the ordered contents of a book)
--
--  No surrogate key: a page belongs to a book once, and the composite primary
--  key says so instead of a unique index bolted on afterwards.
-- ---------------------------------------------------------------------------
create table if not exists public.book_pages (
  book_id    uuid not null references public.books (id) on delete cascade,
  page_id    uuid not null references public.coloring_pages (id) on delete cascade,
  sort_order integer not null default 0,
  primary key (book_id, page_id)
);

create index if not exists book_pages_order_idx on public.book_pages (book_id, sort_order);
create index if not exists book_pages_page_idx  on public.book_pages (page_id);

-- ---------------------------------------------------------------------------
--  long-form copy on a coloring page
--
--  `description` stays the short plain-text line that feeds meta tags and
--  cards; this is the rich body the page editor writes, so a page can carry
--  real copy without the meta description turning into a wall of HTML.
-- ---------------------------------------------------------------------------
alter table public.coloring_pages add column if not exists body_html text;

-- ---------------------------------------------------------------------------
--  Row Level Security - public reads published books only, same as pages.
--  All writes happen server-side with the service-role key, which bypasses it.
-- ---------------------------------------------------------------------------
alter table public.books      enable row level security;
alter table public.book_pages enable row level security;

drop policy if exists books_public_read on public.books;
drop policy if exists books_staff_read  on public.books;
create policy books_public_read on public.books for select using (is_published);
create policy books_staff_read  on public.books for select using (public.is_staff());

-- A row here is only readable when its book is, so a draft book cannot leak
-- its contents through the join table.
drop policy if exists book_pages_public_read on public.book_pages;
drop policy if exists book_pages_staff_read  on public.book_pages;
create policy book_pages_public_read on public.book_pages for select using (
  exists (select 1 from public.books b where b.id = book_id and b.is_published)
);
create policy book_pages_staff_read on public.book_pages for select using (public.is_staff());

-- ---------------------------------------------------------------------------
--  RPC: count a book download. Callable by anon (security definer) but can
--  only ever increment, like track_event.
-- ---------------------------------------------------------------------------
create or replace function public.track_book_download(p_slug text)
returns void language plpgsql security definer set search_path = public as $fn$
begin
  update public.books
     set download_count = download_count + 1
   where slug = p_slug and is_published;
end $fn$;

grant execute on function public.track_book_download(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
--  Dashboard aggregates, extended with the book counts.
-- ---------------------------------------------------------------------------
create or replace function public.admin_stats()
returns jsonb language sql security definer set search_path = public as $fn$
  select jsonb_build_object(
    'pages_total',      (select count(*) from coloring_pages),
    'pages_published',  (select count(*) from coloring_pages where is_published),
    'pages_draft',      (select count(*) from coloring_pages where not is_published),
    'categories_total', (select count(*) from categories),
    'books_total',      (select count(*) from books),
    'books_published',  (select count(*) from books where is_published),
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
