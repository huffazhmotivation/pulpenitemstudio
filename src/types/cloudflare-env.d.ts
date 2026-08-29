// Extends the ambient `CloudflareEnv` interface declared by
// `@opennextjs/cloudflare` with the app's own environment variables /
// secrets, so `getCloudflareContext().env` is typed without casts.
// Keep this in sync with wrangler.toml [vars] and the Cloudflare
// dashboard Secrets (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
// SUPABASE_SERVICE_ROLE_KEY).

export {};

declare global {
  interface CloudflareEnv {
    NEXT_PUBLIC_SUPABASE_URL?: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
  }
}
