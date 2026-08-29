import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * TEMPORARY diagnostic route — DELETE THIS FILE once /admin works.
 *
 * Reports, for each required env var, whether it's visible via the
 * Cloudflare context, via process.env, and its length (never the
 * actual value) — so you can tell which layer is missing a var
 * without exposing secrets in the response or needing `wrangler tail`.
 *
 * Visit /api/debug-env after deploying to see the result.
 */
export async function GET() {
  const keys = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ] as const;

  let cfEnv: Record<string, unknown> = {};
  let cfError: string | null = null;

  try {
    const ctx = await getCloudflareContext({ async: true });
    cfEnv = ctx.env as unknown as Record<string, unknown>;
  } catch (err) {
    cfError = err instanceof Error ? err.message : String(err);
  }

  const report = keys.map((key) => {
    const cfValue = cfEnv[key];
    const processValue = process.env[key];
    return {
      key,
      foundInCloudflareContext: typeof cfValue === "string" && cfValue.length > 0,
      cloudflareValueLength: typeof cfValue === "string" ? cfValue.length : 0,
      foundInProcessEnv: typeof processValue === "string" && processValue.length > 0,
      processEnvValueLength: typeof processValue === "string" ? processValue.length : 0,
    };
  });

  return NextResponse.json({
    getCloudflareContextError: cfError,
    vars: report,
    note: "Delete src/app/api/debug-env once /admin is confirmed working.",
  });
}
