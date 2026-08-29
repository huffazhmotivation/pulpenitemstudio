-- =========================================================
-- Migration: admin-controlled hero image + switch default
-- currency to USD.
-- Safe to run on an existing Pulpenitem Studio database.
-- Run in the Supabase SQL editor (or `supabase db push`).
-- =========================================================

-- Hero image, fully controlled from /admin/homepage. hero_image_alt
-- is used as the <img> alt text for accessibility/SEO.
alter table homepage_settings add column if not exists hero_image_url text;
alter table homepage_settings add column if not exists hero_image_alt text;

-- Switch the site-wide default currency to USD ($) going forward...
alter table fonts alter column currency set default 'USD';
alter table license_prices alter column currency set default 'USD';

-- ...and relabel any existing rows that were stored as IDR so the
-- whole catalog switches over immediately. This only changes the
-- currency label used for formatting — it does NOT convert the
-- numeric price amounts. Review your prices in /admin/fonts after
-- running this migration and adjust any that need rescaling for USD.
update fonts set currency = 'USD' where currency = 'IDR';
update license_prices set currency = 'USD' where currency = 'IDR';
