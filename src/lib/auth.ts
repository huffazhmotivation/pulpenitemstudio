import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AdminProfile } from "@/lib/types/database";

/**
 * Verifies the current request belongs to a signed-in admin.
 * Redirects to /admin/login if not. Use at the top of any admin
 * Server Component, Server Action, or Route Handler before doing any
 * privileged work (e.g. before calling createAdminClient()).
 */
export async function requireAdmin(): Promise<AdminProfile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/admin/login?error=not-authorized");
  }

  return profile as AdminProfile;
}

/** Non-redirecting variant, for places that want a boolean (e.g. middleware). */
export async function getAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
