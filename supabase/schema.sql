-- =========================================================
-- Pulpenitem Studio — Supabase schema
-- Run this in the Supabase SQL editor (or via `supabase db push`)
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- ADMIN PROFILES
-- One row per admin user. auth.users is managed by Supabase Auth
-- (create the user in Authentication > Users, then insert a row here
-- with the same id to grant them access to /admin).
-- ---------------------------------------------------------
create table if not exists admin_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'admin' check (role in ('admin', 'owner')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- CATEGORIES
-- ---------------------------------------------------------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- LICENSES (license *types*, e.g. Desktop, Web, App, Corporate)
-- Prices for a specific font live in license_prices.
-- ---------------------------------------------------------
create table if not exists licenses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- FONTS (the core catalog item)
-- ---------------------------------------------------------
create table if not exists fonts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  short_description text,
  full_description text,
  category_id uuid references categories (id) on delete set null,
  tags text[] not null default '{}',
  designer text,
  release_year integer,
  version text default '1.0',
  language_support text[] not null default '{}',
  font_features text[] not null default '{}',
  price numeric(12, 2) not null default 0,
  currency text not null default 'USD',
  sale_price numeric(12, 2),
  is_on_sale boolean not null default false,
  sale_starts_at timestamptz,
  sale_ends_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'published')),
  is_featured boolean not null default false,
  is_new boolean not null default false,
  cover_image_url text,
  default_preview_text text default 'The quick brown fox jumps over the lazy dog',
  seo_title text,
  meta_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_fonts_status on fonts (status);
create index if not exists idx_fonts_category on fonts (category_id);
create index if not exists idx_fonts_featured on fonts (is_featured) where is_featured = true;
create index if not exists idx_fonts_new on fonts (is_new) where is_new = true;
create index if not exists idx_fonts_on_sale on fonts (is_on_sale) where is_on_sale = true;

-- ---------------------------------------------------------
-- FONT STYLES (Regular, Bold, Italic, Black Condensed, etc.)
-- ---------------------------------------------------------
create table if not exists font_styles (
  id uuid primary key default gen_random_uuid(),
  font_id uuid not null references fonts (id) on delete cascade,
  name text not null,
  weight integer not null default 400,
  is_italic boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_font_styles_font on font_styles (font_id);

-- ---------------------------------------------------------
-- FONT FILES
-- type = 'preview'  -> WOFF/WOFF2, safe to expose publicly, used for
--                      live in-browser rendering.
-- type = 'master'   -> OTF/TTF/ZIP, the sellable deliverable. Stored in
--                      a PRIVATE storage bucket, never linked publicly.
-- ---------------------------------------------------------
create table if not exists font_files (
  id uuid primary key default gen_random_uuid(),
  font_id uuid not null references fonts (id) on delete cascade,
  style_id uuid references font_styles (id) on delete cascade,
  file_type text not null check (file_type in ('preview', 'master')),
  format text not null check (format in ('woff2', 'woff', 'otf', 'ttf', 'zip')),
  storage_path text not null,
  file_size integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_font_files_font on font_files (font_id);
create index if not exists idx_font_files_style on font_files (style_id);
create index if not exists idx_font_files_type on font_files (file_type);

-- ---------------------------------------------------------
-- FONT IMAGES (cover handled on fonts.cover_image_url; this table is
-- the product/specimen gallery)
-- ---------------------------------------------------------
create table if not exists font_images (
  id uuid primary key default gen_random_uuid(),
  font_id uuid not null references fonts (id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_font_images_font on font_images (font_id);

-- ---------------------------------------------------------
-- LICENSE PRICES (per-font price for each license type)
-- ---------------------------------------------------------
create table if not exists license_prices (
  id uuid primary key default gen_random_uuid(),
  font_id uuid not null references fonts (id) on delete cascade,
  license_id uuid not null references licenses (id) on delete cascade,
  price numeric(12, 2) not null default 0,
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  unique (font_id, license_id)
);

create index if not exists idx_license_prices_font on license_prices (font_id);

-- ---------------------------------------------------------
-- SITE SETTINGS (singleton row — contact/order channels, branding)
-- ---------------------------------------------------------
create table if not exists site_settings (
  id integer primary key default 1,
  studio_name text not null default 'Pulpenitem Studio',
  studio_tagline text default 'An independent type foundry.',
  contact_email text,
  whatsapp_number text, -- international format, digits only, e.g. 6281234567890
  instagram_handle text,
  address text,
  footer_note text,
  logo_url text,
  favicon_url text,
  constraint singleton check (id = 1)
);

insert into site_settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------
-- HOMEPAGE SETTINGS (singleton row — editable hero/about copy)
-- ---------------------------------------------------------
create table if not exists homepage_settings (
  id integer primary key default 1,
  hero_eyebrow text default 'Pulpenitem Studio',
  hero_heading text default 'Type, made with intent.',
  hero_subheading text default 'An independent foundry drawing display and text typefaces for editorial, branding, and product work.',
  hero_preview_font_id uuid references fonts (id) on delete set null,
  hero_preview_text text default 'Pulpenitem',
  hero_image_url text,
  hero_image_alt text,
  about_heading text default 'A small studio, drawn by hand.',
  about_body text default 'Pulpenitem Studio is an independent type foundry designing considered, characterful typefaces for editorial, branding, and product work.',
  featured_heading text default 'Featured',
  latest_heading text default 'Latest releases',
  constraint singleton_hp check (id = 1)
);

insert into homepage_settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------
-- HERO IMAGES (ordered gallery for the homepage's auto-sliding hero;
-- when empty, the storefront falls back to homepage_settings.hero_image_url)
-- ---------------------------------------------------------
create table if not exists hero_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_hero_images_sort on hero_images (sort_order);

-- ---------------------------------------------------------
-- updated_at trigger for fonts
-- ---------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_fonts_updated_at on fonts;
create trigger trg_fonts_updated_at
  before update on fonts
  for each row execute function set_updated_at();

-- =========================================================
-- ROW LEVEL SECURITY
-- Public (anon) can only read published fonts and their public
-- relations. All writes go through server-side code using the
-- Supabase service role key (bypasses RLS) after the admin session
-- has been verified in middleware/server actions — so no public
-- write policies are defined here at all.
-- =========================================================

alter table categories enable row level security;
alter table licenses enable row level security;
alter table fonts enable row level security;
alter table font_styles enable row level security;
alter table font_files enable row level security;
alter table font_images enable row level security;
alter table license_prices enable row level security;
alter table site_settings enable row level security;
alter table homepage_settings enable row level security;
alter table hero_images enable row level security;
alter table admin_profiles enable row level security;

-- Public read access -----------------------------------------------------

create policy "categories are publicly readable"
  on categories for select
  using (true);

create policy "licenses are publicly readable"
  on licenses for select
  using (true);

create policy "published fonts are publicly readable"
  on fonts for select
  using (status = 'published');

create policy "styles of published fonts are publicly readable"
  on font_styles for select
  using (exists (
    select 1 from fonts f where f.id = font_styles.font_id and f.status = 'published'
  ));

create policy "preview files of published fonts are publicly readable"
  on font_files for select
  using (
    file_type = 'preview'
    and exists (select 1 from fonts f where f.id = font_files.font_id and f.status = 'published')
  );

create policy "images of published fonts are publicly readable"
  on font_images for select
  using (exists (
    select 1 from fonts f where f.id = font_images.font_id and f.status = 'published'
  ));

create policy "license prices of published fonts are publicly readable"
  on license_prices for select
  using (exists (
    select 1 from fonts f where f.id = license_prices.font_id and f.status = 'published'
  ));

create policy "site settings are publicly readable"
  on site_settings for select
  using (true);

create policy "homepage settings are publicly readable"
  on homepage_settings for select
  using (true);

create policy "hero images are publicly readable"
  on hero_images for select
  using (true);

-- admin_profiles: a logged-in user may read their own row (used by
-- middleware/server code to confirm admin status). No public policy.
create policy "admins can read own profile"
  on admin_profiles for select
  using (auth.uid() = id);

-- NOTE: master font files (file_type = 'master') have NO select policy
-- for anon/public at all — they are only ever read using the service
-- role key from trusted server code (e.g. an admin-only download route).
