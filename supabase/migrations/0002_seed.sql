-- ============================================================================
--  onlinecolorpage.com - seed data
--  Default site settings, ad slots and a starter set of kid-friendly
--  categories. Run after 0001_init.sql. Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
--  site settings
-- ---------------------------------------------------------------------------
insert into public.settings (key, value) values
  ('site', jsonb_build_object(
      'name',        'Online Color Page',
      'tagline',     'Free coloring pages kids actually love',
      'description', 'Thousands of free printable coloring pages plus a fun online coloring game. Color on your screen, download a PNG, or print the PDF - no sign-up needed.',
      'email',       'hello@onlinecolorpage.com',
      'logo_key',    null,
      'favicon_key', null
    )),
  ('home', jsonb_build_object(
      'hero_title',    'Color. Play. Print!',
      'hero_subtitle', 'Pick a picture, splash some color, and show the world your masterpiece.',
      'hero_cta',      'Start Coloring',
      'show_featured', true,
      'show_popular',  true,
      'show_newest',   true,
      'grid_size',     24
    )),
  ('seo', jsonb_build_object(
      'title_suffix',  ' | Online Color Page',
      'default_title', 'Free Printable & Online Coloring Pages for Kids',
      'default_description', 'Color online in your browser or print free coloring pages for kids. Animals, cartoons, vehicles, princesses and more - all free, all fun.',
      'og_image_key',  null,
      'twitter',       '',
      'facebook',      '',
      'instagram',     '',
      'pinterest',     ''
    )),
  ('features', jsonb_build_object(
      'sounds_default_on', true,
      'confetti',          true,
      'rewards',           true,
      'guide_mode',        true,
      'allow_downloads',   true,
      'maintenance',       false
    )),
  ('ads', jsonb_build_object(
      'client',  '',
      'enabled', false
    ))
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
--  ad slots (code is pasted in from the admin panel)
-- ---------------------------------------------------------------------------
insert into public.ad_slots (slot_key, name, is_active) values
  ('header',       'Header banner (below nav)',          false),
  ('grid_inline',  'Inside coloring-page grid',          false),
  ('sidebar',      'Sidebar / rail',                     false),
  ('below_canvas', 'Below the coloring canvas',          false),
  ('page_bottom',  'Bottom of page (above footer)',      false)
on conflict (slot_key) do nothing;

-- ---------------------------------------------------------------------------
--  starter categories
-- ---------------------------------------------------------------------------
insert into public.categories (slug, name, description, emoji, color, sort_order) values
  ('animals',    'Animals',    'Lions, cats, puppies, elephants and every furry friend in between.', '🐾', '#F97316',  1),
  ('cartoons',   'Cartoons',   'Favourite cartoon characters ready for a fresh coat of color.',       '⭐', '#8B5CF6',  2),
  ('vehicles',   'Vehicles',   'Cars, trucks, planes, trains and rockets for little speed lovers.',   '🚗', '#0EA5E9',  3),
  ('princess',   'Princess',   'Castles, crowns, gowns and fairy-tale friends.',                      '👑', '#EC4899',  4),
  ('dinosaurs',  'Dinosaurs',  'T-Rex, triceratops and the whole prehistoric crew.',                  '🦖', '#22C55E',  5),
  ('flowers',    'Flowers',    'Roses, sunflowers, tulips and pretty garden patterns.',               '🌸', '#F43F5E',  6),
  ('alphabet',   'ABC & 123',  'Letters, numbers and first words - color while you learn.',           '🔤', '#FACC15',  7),
  ('holidays',   'Holidays',   'Diwali, Christmas, Halloween, Easter and birthday fun.',              '🎁', '#A855F7',  8),
  ('space',      'Space',      'Planets, astronauts, rockets and friendly aliens.',                   '🚀', '#6366F1',  9),
  ('food',       'Food',       'Ice cream, pizza, cupcakes and tasty treats.',                        '🍰', '#FB923C', 10),
  ('nature',     'Nature',     'Trees, mountains, rainbows, oceans and weather.',                     '🌳', '#14B8A6', 11),
  ('mandalas',   'Mandalas',   'Calm, detailed patterns for older kids and grown-ups.',               '🌀', '#64748B', 12)
on conflict (slug) do nothing;
