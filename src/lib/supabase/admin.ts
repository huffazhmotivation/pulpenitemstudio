import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getCloudflareContext } from "@opennextjs/cloudflare";

type CloudflareEnv = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
};

function getEnv(name: keyof CloudflareEnv): string {
  // Local development
  const localValue = process.env[name];
  if (localValue) return localValue;

  // Cloudflare Workers / OpenNext
  try {
    const { env } = getCloudflareContext();
    const cloudflareValue = (env as CloudflareEnv)[name];

    if (cloudflareValue) return cloudflareValue;
  } catch {
    // Ignore and throw explicit error below
  }

  throw new Error(`Missing required environment variable: ${name}`);
}

export function createAdminClient() {
  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
