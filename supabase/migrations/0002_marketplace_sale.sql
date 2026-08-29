-- =========================================================
-- Migration: marketplace redesign — sale pricing fields
-- Safe to run on an existing Pulpenitem Studio database:
-- only adds new nullable/defaulted columns, changes nothing
-- else. Run in the Supabase SQL editor (or `supabase db push`).
-- =========================================================

alter table fonts add column if not exists sale_price numeric(12, 2);
alter table fonts add column if not exists is_on_sale boolean not null default false;
alter table fonts add column if not exists sale_starts_at timestamptz;
alter table fonts add column if not exists sale_ends_at timestamptz;

create index if not exists idx_fonts_on_sale on fonts (is_on_sale) where is_on_sale = true;
