// Extends the ambient `CloudflareEnv` interface declared by
// `@opennextjs/cloudflare` with this app's bindings, so
// `getCloudflareContext().env` is typed. Keep in sync with wrangler.toml.

import type { D1Database, R2Bucket } from "@cloudflare/workers-types";

export {};

declare global {
  interface CloudflareEnv {
    /** Cloudflare D1 database (all content + admin accounts). */
    DB: D1Database;
    /** Cloudflare R2 bucket (font previews, gallery images, private masters). */
    MEDIA: R2Bucket;
    /** Secret used to sign admin session cookies (`wrangler secret put AUTH_SECRET`). */
    AUTH_SECRET?: string;
  }
}
