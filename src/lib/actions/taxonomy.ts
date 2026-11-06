"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/db";
import { slugify } from "@/lib/utils";

// ---------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------

export async function createCategory(formData: FormData) {
  await requireAdmin();
  const db = await createAdminClient();
  const name = String(formData.get("name") ?? "").trim();
  const { error } = await db.from("categories").insert({
    name,
    slug: slugify(String(formData.get("slug") || name)),
    description: formData.get("description") || null,
    sort_order: Number(formData.get("sort_order") ?? 0),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/categories");
  revalidatePath("/fonts");
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAdmin();
  const db = await createAdminClient();
  const name = String(formData.get("name") ?? "").trim();
  const { error } = await db
    .from("categories")
    .update({
      name,
      slug: slugify(String(formData.get("slug") || name)),
      description: formData.get("description") || null,
      sort_order: Number(formData.get("sort_order") ?? 0),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/categories");
  revalidatePath("/fonts");
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  const db = await createAdminClient();
  const { error } = await db.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/categories");
  revalidatePath("/fonts");
}

// ---------------------------------------------------------------------
// Licenses
// ---------------------------------------------------------------------

export async function createLicense(formData: FormData) {
  await requireAdmin();
  const db = await createAdminClient();
  const name = String(formData.get("name") ?? "").trim();
  const { error } = await db.from("licenses").insert({
    name,
    slug: slugify(String(formData.get("slug") || name)),
    description: formData.get("description") || null,
    sort_order: Number(formData.get("sort_order") ?? 0),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/licenses");
  revalidatePath("/license");
}

export async function updateLicense(id: string, formData: FormData) {
  await requireAdmin();
  const db = await createAdminClient();
  const name = String(formData.get("name") ?? "").trim();
  const { error } = await db
    .from("licenses")
    .update({
      name,
      slug: slugify(String(formData.get("slug") || name)),
      description: formData.get("description") || null,
      sort_order: Number(formData.get("sort_order") ?? 0),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/licenses");
  revalidatePath("/license");
}

export async function deleteLicense(id: string) {
  await requireAdmin();
  const db = await createAdminClient();
  const { error } = await db.from("licenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/licenses");
  revalidatePath("/license");
}
