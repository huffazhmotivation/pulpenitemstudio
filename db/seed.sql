-- Optional starter data for a fresh database (do NOT run after importing real data).
INSERT OR IGNORE INTO categories (id, name, slug, description, sort_order) VALUES
  ('cat-serif', 'Serif', 'serif', 'Text and display serifs.', 1),
  ('cat-sans', 'Sans', 'sans', 'Grotesk and humanist sans.', 2),
  ('cat-display', 'Display', 'display', 'Headline and expressive display faces.', 3),
  ('cat-mono', 'Mono', 'mono', 'Monospaced faces for code and data.', 4);

INSERT OR IGNORE INTO licenses (id, name, slug, description, sort_order) VALUES
  ('lic-desktop', 'Desktop', 'desktop', 'Install and use on desktop apps (up to 5 seats).', 1),
  ('lic-web', 'Web', 'web', 'Use as a self-hosted webfont on one domain.', 2),
  ('lic-app', 'App', 'app', 'Embed in a mobile or desktop application.', 3),
  ('lic-corporate', 'Corporate', 'corporate', 'Studio-wide use across an organisation.', 4);
