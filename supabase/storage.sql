-- =========================================================
-- Supabase Storage buckets for Pulpenitem Studio
-- Run after schema.sql. Also do this once from the Dashboard if you
-- prefer clicking: Storage > New bucket.
-- =========================================================

-- Public bucket: WOFF/WOFF2 preview fonts + product/gallery/cover images
insert into storage.buckets (id, name, public)
values ('font-previews', 'font-previews', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('font-images', 'font-images', true)
on conflict (id) do nothing;

-- Private bucket: OTF/TTF/ZIP master files. NEVER made public.
insert into storage.buckets (id, name, public)
values ('font-masters', 'font-masters', false)
on conflict (id) do nothing;

-- Public read for the two public buckets
create policy "public read font-previews"
  on storage.objects for select
  using (bucket_id = 'font-previews');

create policy "public read font-images"
  on storage.objects for select
  using (bucket_id = 'font-images');

-- No policies are created for font-masters, so only the service role
-- key (used exclusively in trusted server code, e.g. admin upload
-- routes and a future signed-download route) can read/write it.
