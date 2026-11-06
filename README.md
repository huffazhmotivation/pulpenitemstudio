# Pulpenitem Studio

Font shop (storefront + admin). **Stack:** Next.js 15 (App Router) · TypeScript · Tailwind · Cloudflare Workers (OpenNext) · **D1** (database) · **R2** (files). Everything runs on Cloudflare's free tier; no external services.

| What | Where |
|---|---|
| Fonts, categories, licenses, settings, admin accounts | D1 database `pulpenitem-studio` (`migrations/`) |
| Preview fonts, gallery images, private master files | R2 bucket `pulpenitem-media` (served publicly via `/media/...`, masters only via the admin download route) |
| Admin login | Signed cookie session (`AUTH_SECRET`) + PBKDF2 password hash in D1 |

## Local development

```bash
npm install
printf 'AUTH_SECRET=%s\n' "$(openssl rand -hex 24)" > .dev.vars
npx wrangler d1 migrations apply DB --local
npx wrangler d1 execute DB --local --file db/seed.sql      # optional starter categories/licenses
node scripts/create-admin.mjs you@example.com 'a-long-password'
npm run dev
```

Local D1/R2 state lives in `.wrangler/` (git-ignored). Admin is at `/admin`.

## Deploy to Cloudflare (free tier)

```bash
npx wrangler login                                  # the account that will host the site
npx wrangler d1 create pulpenitem-studio            # copy the database_id into wrangler.toml
npx wrangler r2 bucket create pulpenitem-media
npx wrangler d1 migrations apply DB --remote
npx wrangler secret put AUTH_SECRET                 # paste a long random string
node scripts/create-admin.mjs you@example.com 'a-long-password' --remote
npm run cf:deploy
```

## Migrating from the old Supabase setup

```bash
SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... \
  node scripts/migrate-from-supabase.mjs --remote
node scripts/create-admin.mjs you@example.com 'new-password' --remote
```

It only reads from Supabase. It copies all rows and storage files, rewrites image URLs to `/media/...`, and locks imported admin passwords (set a new one with `create-admin.mjs`). Use `--dry` to only export to `migration-out/`.

## Notes

- Public pages never expose master files: `/media` serves only the preview and image prefixes.
- Images are served as-is (`images.unoptimized`), avoiding the paid image optimizer.
- No login rate limiting yet; use a long password.
