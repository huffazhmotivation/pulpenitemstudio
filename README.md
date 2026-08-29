# Pulpenitem Studio

An independent type foundry storefront — browse fonts, test them live in the
browser, check licenses/prices, then order via WhatsApp or email. Not a full
checkout yet, but the schema is shaped so a cart/payment flow can be layered
on later without a rewrite.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase
(Postgres + Auth + Storage) · deployed to Cloudflare Workers via
`@opennextjs/cloudflare`.

---

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run, in order:
   1. `supabase/schema.sql` — tables, indexes, RLS policies.
   2. `supabase/storage.sql` — creates the three storage buckets
      (`font-previews`, `font-images` public; `font-masters` private) and
      their read policies.
   3. `supabase/seed.sql` *(optional)* — a demo category, license set, and
      one sample font so you have something to look at immediately.

   **Already have a Pulpenitem Studio database from before the marketplace
   redesign?** Skip re-running `schema.sql` and instead run
   `supabase/migrations/0002_marketplace_sale.sql` — it only adds the new
   `sale_price` / `is_on_sale` / `sale_starts_at` / `sale_ends_at` columns
   used by the Sale feature, and is safe to run on existing data.
3. **Create your admin account:** Authentication → Users → Add user (email
   + password). Copy the new user's UUID, then in the SQL editor run:
   ```sql
   insert into admin_profiles (id, full_name, role)
   values ('paste-the-uuid-here', 'Your Name', 'owner');
   ```
   Only users with a matching row in `admin_profiles` can sign in to `/admin`
   — creating the auth user alone is not enough.
4. Grab your keys from Project Settings → API:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only, never
     ship this to the browser)

## 2. Local development

```bash
npm install
cp .env.example .env.local   # fill in the three Supabase values above
npm run dev
```

- Storefront: http://localhost:3000
- Admin: http://localhost:3000/admin/login

## 3. How content flows

Everything customer-facing is editable from `/admin` — no code changes
needed for day-to-day catalog work:

- **Fonts** — details, SEO, styles (Regular/Bold/Italic/…), preview file
  uploads (WOFF2/WOFF, public), master file uploads (OTF/TTF/ZIP, private),
  gallery + cover images, per-license pricing, draft/publish, Featured/New
  flags.
- **Categories** and **Licenses** — the taxonomy fonts are filtered/priced
  by.
- **Settings** — studio name/tagline, WhatsApp number, contact email,
  Instagram, footer note. The WhatsApp/email order buttons on every font
  page read from here.
- **Homepage** — hero copy, which font powers the live hero specimen, and
  the About section text.

### Preview vs. master files — why they're separate

- **Preview files** (`font-previews` bucket, public) are WOFF/WOFF2 only.
  They're what the browser fetches to render live text on the site. Never
  put a full OTF/TTF in this bucket.
- **Master files** (`font-masters` bucket, private) are the sellable
  OTF/TTF/ZIP deliverables. No RLS policy grants public or anon access to
  this bucket at all — the only way to read from it is the service-role
  key from trusted server code. `GET /api/admin/download/[fileId]` is an
  admin-only route that mints a 60-second signed URL so you can fetch a
  master file to send to a customer after confirming their order.

### Ordering flow (current)

There's no cart/checkout yet, by design. A customer picks a license on the
font page → clicks **Order via WhatsApp** or **Order via Email** → a
message pre-filled with the font name, license, and price opens in their
WhatsApp/email client → you confirm and send the master file manually
(via the signed download route above, or however you prefer).

## 4. Deploying to Cloudflare Workers

```bash
npm install -g wrangler   # if you don't have it
wrangler login
```

Set your production secrets (these are **not** committed anywhere):

```bash
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

`NEXT_PUBLIC_*` values are safe to be public — set them as plain `vars` in
`wrangler.toml` (already stubbed) or via `wrangler secret put` if you'd
rather not commit them.

Build and deploy:

```bash
npm run cf:deploy
```

This runs `@opennextjs/cloudflare` to build a Workers-compatible bundle and
publishes it. `npm run cf:preview` runs the same build locally against the
Workers runtime (via `wrangler dev`) before you deploy.

**Note on caching:** the default in-memory ISR/data cache resets on every
Worker cold start. For production-grade incremental caching, add a KV
namespace (`wrangler kv namespace create NEXT_CACHE`), uncomment the
`[[kv_namespaces]]` block in `wrangler.toml`, and follow the
[`@opennextjs/cloudflare` caching docs](https://opennext.js.org/cloudflare)
to wire it into `open-next.config.ts`. The app works correctly without
this — it just means Next's data cache won't persist across cold starts.

## 5. What's deliberately *not* built yet (structured for later)

- **Cart / checkout** — `fonts`, `license_prices`, and `font_files` are
  already normalized so a `cart_items` / `orders` / `order_items` set of
  tables can be added without touching the existing schema.
- **Payments (Midtrans/Xendit/Stripe)** — none wired in; the order buttons
  are WhatsApp/email links, not a payment form.
- **Customer accounts** — no `customers`/auth-for-buyers table yet.
- **Automatic download delivery** — the admin signed-download route is the
  seed of this; extending it to a customer-facing, order-gated download
  page is the natural next step once checkout exists.

## Project structure

```
src/
  app/
    (site)/            Public storefront (home, fonts, fonts/[slug], about, license, contact)
    admin/
      login/            Standalone login (no dashboard chrome)
      (dashboard)/       Auth-gated: dashboard, fonts, categories, licenses, settings, homepage
    api/admin/download/[fileId]/   Signed master-file download (admin-only)
  components/
    site/               Public-facing components (FontCard, FontTester, OrderButtons, …)
    admin/              Admin-only form/manager components
    ui/                 Shared primitives (Button, Input, Select, …)
  lib/
    actions/            Server actions (auth, fonts, taxonomy, settings) — all writes go through here
    supabase/           Browser / server (anon) / admin (service-role) Supabase clients
    queries.ts          Public read helpers (RLS-scoped, used by storefront pages)
    auth.ts             requireAdmin() guard used by every admin page/action
    order-links.ts       WhatsApp / email link builders
supabase/
  schema.sql, storage.sql, seed.sql
```
