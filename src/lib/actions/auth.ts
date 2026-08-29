"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    redirect(`/admin/login?error=invalid-credentials`);
  }

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("id")
    .eq("id", data.user.id)
    .single();

  if (!profile) {
    await supabase.auth.signOut();
    redirect(`/admin/login?error=not-authorized`);
  }

  redirect(next || "/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
