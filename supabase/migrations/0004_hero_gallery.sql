-- =========================================================
-- Migration: multi-image hero gallery
-- Lets the admin upload several hero images that auto-slide on the
-- homepage (instead of a single static hero image). Safe to run on
-- an existing Pulpenitem Studio database.
-- Run in the Supabase SQL editor (or `supabase db push`).
-- =========================================================

create table if not exists hero_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_hero_images_sort on hero_images (sort_order);

alter table hero_images enable row level security;

create policy "hero images are publicly readable"
  on hero_images for select
  using (true);

-- The old single hero_image_url / hero_image_alt columns on
-- homepage_settings are left in place on purpose: if hero_images ends
-- up empty, the storefront falls back to treating that one image as
-- a one-slide gallery, so nothing already configured disappears.
