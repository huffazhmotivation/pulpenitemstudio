-- Optional starter data. Safe to run once after schema.sql + storage.sql.

insert into categories (name, slug, description, sort_order) values
  ('Serif', 'serif', 'Text and display serifs.', 1),
  ('Sans', 'sans', 'Grotesk and humanist sans.', 2),
  ('Display', 'display', 'Headline and expressive display faces.', 3),
  ('Mono', 'mono', 'Monospaced faces for code and data.', 4)
on conflict (slug) do nothing;

insert into licenses (name, slug, description, sort_order) values
  ('Desktop', 'desktop', 'Install and use on desktop apps (up to 5 seats).', 1),
  ('Web', 'web', 'Use as a self-hosted webfont on one domain.', 2),
  ('App', 'app', 'Embed in a mobile or desktop application.', 3),
  ('Corporate', 'corporate', 'Studio-wide use across an organisation.', 4)
on conflict (slug) do nothing;

-- A demo font entry (no real files attached — add those from /admin).
insert into fonts (
  name, slug, short_description, full_description, category_id,
  tags, designer, release_year, version, language_support, font_features,
  price, currency, status, is_featured, is_new, default_preview_text,
  seo_title, meta_description
)
select
  'Pulpen Serif',
  'pulpen-serif',
  'A quiet editorial serif with a sharpened axe.',
  'Pulpen Serif is a text-and-display serif drawn for long-form reading and confident headlines alike. High contrast strokes, ink-trap details at small sizes, and a wide range of optical weights make it equally at home in a magazine spread or a product wordmark.',
  c.id,
  array['editorial','serif','headline'],
  'Studio Pulpenitem',
  2024,
  '1.0',
  array['Latin','Latin Extended'],
  array['Ligatures','Old-style figures','Small caps','Alternates'],
  29,
  'USD',
  'published',
  true,
  true,
  'The quick brown fox jumps over the lazy dog',
  'Pulpen Serif — Pulpenitem Studio',
  'Pulpen Serif, an editorial text and display serif by Pulpenitem Studio.'
from categories c where c.slug = 'serif'
on conflict (slug) do nothing;

insert into font_styles (font_id, name, weight, is_italic, sort_order)
select f.id, s.name, s.weight, s.is_italic, s.sort_order
from fonts f,
  (values
    ('Regular', 400, false, 1),
    ('Italic', 400, true, 2),
    ('Bold', 700, false, 3),
    ('Bold Italic', 700, true, 4)
  ) as s(name, weight, is_italic, sort_order)
where f.slug = 'pulpen-serif';

insert into license_prices (font_id, license_id, price, currency)
select f.id, l.id,
  case l.slug
    when 'desktop' then 29
    when 'web' then 39
    when 'app' then 59
    when 'corporate' then 149
  end,
  'USD'
from fonts f, licenses l
where f.slug = 'pulpen-serif';
