import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in Client Components. Uses the public anon
 * key, so it is subject to the RLS policies in supabase/schema.sql.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
