import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getCloudflareContext } from "@opennextjs/cloudflare";

function getServerEnv(name: string): string {
  // Local Next.js
  const localValue = process.env[name];
  if (localValue) return localValue;

  // Cloudflare Workers / OpenNext
  try {
    const env = getCloudflareContext().env as Record<string, unknown>;
    const value = env[name];

    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  } catch {
    // Fall through to explicit error below
  }

  throw new Error(`Missing required environment variable: ${name}`);
}

export function createAdminClient() {
  const supabaseUrl = getServerEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getServerEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
