import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Privileged Supabase client using the SERVICE ROLE key. This bypasses
 * Row Level Security entirely, so it must:
 *   1. Never be imported into any Client Component or exposed to the
 *      browser (the `server-only` import above enforces this at build
 *      time).
 *   2. Only ever be called from code paths that have already verified
 *      the current user is a signed-in admin (see requireAdmin() in
 *      src/lib/auth.ts), i.e. from Server Actions / Route Handlers
 *      under src/app/admin or src/app/api/admin.
 *
 * On Cloudflare Workers, `process.env` is not reliably populated with
 * Worker vars/secrets — they live on the Cloudflare runtime context
 * instead, and reading that context requires an async call
 * (`getCloudflareContext({ async: true })`). This function is async
 * for that reason: it reads env vars from the Cloudflare context when
 * running on Workers, and falls back to `process.env` (populated from
 * `.env.local`) for plain `next dev` / `next build` locally, where no
 * Cloudflare context exists.
 */
export async function createAdminClient() {
  const { url, serviceRoleKey } = await getSupabaseAdminEnv();

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function getSupabaseAdminEnv(): Promise<{ url: string; serviceRoleKey: string }> {
  let cfEnv: { NEXT_PUBLIC_SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE_KEY?: string } = {};

  try {
    const { env } = await getCloudflareContext({ async: true });
    cfEnv = env;
  } catch {
    // No Cloudflare runtime available — e.g. local `next dev` run
    // directly (not through `wrangler`/OpenNext). Fall back to
    // process.env below, which `.env.local` populates in that case.
  }

  const url = cfEnv.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = cfEnv.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!serviceRoleKey) {
    throw new Error("Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }

  return { url, serviceRoleKey };
}
