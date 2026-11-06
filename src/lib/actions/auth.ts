"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { requireAdmin } from "@/lib/auth";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken } from "@/lib/session";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const rawNext = String(formData.get("next") ?? "/admin");
  // Only allow same-site relative redirects.
  const next = rawNext.startsWith("/admin") && !rawNext.startsWith("//") ? rawNext : "/admin";

  let failure: string | null = null;
  try {
    const db = await createAdminClient();
    const { data: profile } = await db
      .from("admin_profiles")
      .select("id, password_hash")
      .eq("email", email)
      .maybeSingle();

    const ok = await verifyPassword(password, profile?.password_hash);
    if (!ok || !profile) {
      failure = "invalid-credentials";
    } else {
      const store = await cookies();
      store.set(SESSION_COOKIE, await createSessionToken(profile.id), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_MAX_AGE,
      });
    }
  } catch (e) {
    console.error("signIn failed", e);
    failure = "server-error";
  }
  if (failure) redirect(`/admin/login?error=${encodeURIComponent(failure)}`);

  redirect(next);
}

export async function signOut() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/admin/login");
}

export async function changePassword(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const admin = await requireAdmin();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (next.length < 10) return { ok: false, message: "New password must be at least 10 characters." };
  if (next !== confirm) return { ok: false, message: "New password and confirmation do not match." };
  if (next === current) return { ok: false, message: "New password must be different from the current one." };

  const db = await createAdminClient();
  const { data: row } = await db.from("admin_profiles").select("password_hash").eq("id", admin.id).maybeSingle();
  if (!(await verifyPassword(current, row?.password_hash))) {
    return { ok: false, message: "Current password is incorrect." };
  }

  const { error } = await db
    .from("admin_profiles")
    .update({ password_hash: await hashPassword(next) })
    .eq("id", admin.id);
  if (error) return { ok: false, message: "Could not save the new password. Try again." };

  return { ok: true, message: "Password updated." };
}
