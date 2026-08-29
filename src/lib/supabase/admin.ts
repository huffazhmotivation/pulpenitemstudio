import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

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
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
