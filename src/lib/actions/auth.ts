"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken } from "@/lib/session";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const rawNext = String(formData.get("next") ?? "/admin");
  // Only allow same-site relative redirects.
  const next = rawNext.startsWith("/admin") && !rawNext.startsWith("//") ? rawNext : "/admin";

  const db = await createAdminClient();
  const { data: profile } = await db
    .from("admin_profiles")
    .select("id, password_hash")
    .eq("email", email)
    .maybeSingle();

  const ok = await verifyPassword(password, profile?.password_hash);
  if (!ok || !profile) redirect("/admin/login?error=invalid-credentials");

  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken(profile.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  redirect(next);
}

export async function signOut() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/admin/login");
}
