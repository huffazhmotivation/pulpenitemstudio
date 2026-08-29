"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUCKETS } from "@/lib/storage";

export async function updateSiteSettings(formData: FormData) {
  await requireAdmin();
  const db = await createAdminClient();

  const { error } = await db
    .from("site_settings")
    .update({
      studio_name: String(formData.get("studio_name") ?? "Pulpenitem Studio"),
      studio_tagline: formData.get("studio_tagline") || null,
      contact_email: formData.get("contact_email") || null,
      whatsapp_number: formData.get("whatsapp_number") || null,
      instagram_handle: formData.get("instagram_handle") || null,
      address: formData.get("address") || null,
      footer_note: formData.get("footer_note") || null,
    })
    .eq("id", 1);

  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
}

export async function addHeroImages(formData: FormData) {
  await requireAdmin();
  const db = await createAdminClient();

  const files = formData.getAll("hero_images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return;

  const { data: existing } = await db.from("hero_images").select("sort_order").order("sort_order", { ascending: false }).limit(1);
  let nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  for (const file of files) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `hero/${nanoid(10)}.${ext}`;
    const { error: uploadError } = await db.storage.from(BUCKETS.images).upload(path, file, {
      contentType: file.type || undefined,
      upsert: false,
    });
    if (uploadError) throw new Error(uploadError.message);

    const { data: pub } = db.storage.from(BUCKETS.images).getPublicUrl(path);
    const { error } = await db.from("hero_images").insert({
      image_url: pub.publicUrl,
      alt_text: file.name.replace(/\.[^.]+$/, ""),
      sort_order: nextOrder++,
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin/homepage");
}

export async function deleteHeroImage(id: string) {
  await requireAdmin();
  const db = await createAdminClient();

  const { error } = await db.from("hero_images").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/homepage");
}

export async function moveHeroImage(id: string, direction: "up" | "down") {
  await requireAdmin();
  const db = await createAdminClient();

  const { data: images, error: fetchError } = await db
    .from("hero_images")
    .select("id, sort_order")
    .order("sort_order", { ascending: true });
  if (fetchError) throw new Error(fetchError.message);
  if (!images) return;

  const index = images.findIndex((img) => img.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= images.length) return;

  const a = images[index];
  const b = images[swapWith];

  const { error: err1 } = await db.from("hero_images").update({ sort_order: b.sort_order }).eq("id", a.id);
  if (err1) throw new Error(err1.message);
  const { error: err2 } = await db.from("hero_images").update({ sort_order: a.sort_order }).eq("id", b.id);
  if (err2) throw new Error(err2.message);

  revalidatePath("/");
  revalidatePath("/admin/homepage");
}

export async function updateHomepageSettings(formData: FormData) {
  await requireAdmin();
  const db = await createAdminClient();

  const heroFontId = formData.get("hero_preview_font_id");

  const update: Record<string, unknown> = {
    hero_eyebrow: formData.get("hero_eyebrow") || null,
    hero_heading: formData.get("hero_heading") || null,
    hero_subheading: formData.get("hero_subheading") || null,
    hero_preview_font_id: heroFontId ? heroFontId : null,
    hero_preview_text: formData.get("hero_preview_text") || null,
    hero_image_alt: formData.get("hero_image_alt") || null,
    about_heading: formData.get("about_heading") || null,
    about_body: formData.get("about_body") || null,
    featured_heading: formData.get("featured_heading") || null,
    latest_heading: formData.get("latest_heading") || null,
  };

  // "Remove hero image" checkbox wins even if a new file was also picked,
  // so unchecking is always predictable.
  const removeImage = formData.get("hero_image_remove") === "on";
  const file = formData.get("hero_image") as File | null;

  if (removeImage) {
    update.hero_image_url = null;
  } else if (file && file.size > 0) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `homepage/hero-${nanoid(10)}.${ext}`;
    const { error: uploadError } = await db.storage.from(BUCKETS.images).upload(path, file, {
      contentType: file.type || undefined,
      upsert: false,
    });
    if (uploadError) throw new Error(uploadError.message);

    const { data: pub } = db.storage.from(BUCKETS.images).getPublicUrl(path);
    update.hero_image_url = pub.publicUrl;
  }
  // If neither is set, hero_image_url is simply left out of the update
  // so the existing image stays untouched.

  const { error } = await db.from("homepage_settings").update(update).eq("id", 1);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/homepage");
}
