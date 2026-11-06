import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import type { AdminProfile } from "@/lib/types/database";

async function currentProfile(): Promise<AdminProfile | null> {
  const store = await cookies();
  const userId = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  const db = await createAdminClient();
  const { data } = await db
    .from("admin_profiles")
    .select("id, email, full_name, role, created_at")
    .eq("id", userId)
    .maybeSingle();
  return (data as AdminProfile) ?? null;
}

/**
 * Verifies the current request belongs to a signed-in admin.
 * Redirects to /admin/login if not. Call at the top of any admin Server
 * Component, Server Action, or Route Handler before doing privileged work.
 */
export async function requireAdmin(): Promise<AdminProfile> {
  const profile = await currentProfile();
  if (!profile) redirect("/admin/login");
  return profile;
}

/** Non-redirecting variant. */
export async function getAdminUser(): Promise<AdminProfile | null> {
  return currentProfile();
}
