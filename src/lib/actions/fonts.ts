"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/db";
import { slugify, MAX_GALLERY_IMAGES } from "@/lib/utils";
import { BUCKETS } from "@/lib/storage";
import type { FileFormat, FileType } from "@/lib/types/database";

function parseList(value: FormDataEntryValue | null): string[] {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function numOrNull(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function isoOrNull(value: FormDataEntryValue | null): string | null {
  if (!value || String(value).trim() === "") return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// ---------------------------------------------------------------------
// Font core CRUD
// ---------------------------------------------------------------------

export async function createFont(formData: FormData) {
  await requireAdmin();
  const db = await createAdminClient();

  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const slug = slugify(slugInput || name);

  const { data, error } = await db
    .from("fonts")
    .insert({
      name,
      slug,
      short_description: formData.get("short_description") || null,
      full_description: formData.get("full_description") || null,
      category_id: formData.get("category_id") || null,
      tags: parseList(formData.get("tags")),
      designer: formData.get("designer") || null,
      release_year: numOrNull(formData.get("release_year")),
      version: formData.get("version") || "1.0",
      language_support: parseList(formData.get("language_support")),
      font_features: parseList(formData.get("font_features")),
      price: Number(formData.get("price") ?? 0),
      currency: formData.get("currency") || "USD",
      sale_price: numOrNull(formData.get("sale_price")),
      is_on_sale: formData.get("is_on_sale") === "on",
      sale_starts_at: isoOrNull(formData.get("sale_starts_at")),
      sale_ends_at: isoOrNull(formData.get("sale_ends_at")),
      status: formData.get("status") === "published" ? "published" : "draft",
      is_featured: formData.get("is_featured") === "on",
      is_new: formData.get("is_new") === "on",
      default_preview_text: formData.get("default_preview_text") || null,
      seo_title: formData.get("seo_title") || null,
      meta_description: formData.get("meta_description") || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create font");
  }

  revalidatePath("/admin/fonts");
  revalidatePath("/fonts");
  redirect(`/admin/fonts/${data.id}`);
}

export async function updateFont(fontId: string, formData: FormData) {
  await requireAdmin();
  const db = await createAdminClient();

  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const slug = slugify(slugInput || name);

  const { error } = await db
    .from("fonts")
    .update({
      name,
      slug,
      short_description: formData.get("short_description") || null,
      full_description: formData.get("full_description") || null,
      category_id: formData.get("category_id") || null,
      tags: parseList(formData.get("tags")),
      designer: formData.get("designer") || null,
      release_year: numOrNull(formData.get("release_year")),
      version: formData.get("version") || "1.0",
      language_support: parseList(formData.get("language_support")),
      font_features: parseList(formData.get("font_features")),
      price: Number(formData.get("price") ?? 0),
      currency: formData.get("currency") || "USD",
      sale_price: numOrNull(formData.get("sale_price")),
      is_on_sale: formData.get("is_on_sale") === "on",
      sale_starts_at: isoOrNull(formData.get("sale_starts_at")),
      sale_ends_at: isoOrNull(formData.get("sale_ends_at")),
      status: formData.get("status") === "published" ? "published" : "draft",
      is_featured: formData.get("is_featured") === "on",
      is_new: formData.get("is_new") === "on",
      default_preview_text: formData.get("default_preview_text") || null,
      seo_title: formData.get("seo_title") || null,
      meta_description: formData.get("meta_description") || null,
    })
    .eq("id", fontId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/fonts");
  revalidatePath(`/admin/fonts/${fontId}`);
  revalidatePath("/fonts");
  revalidatePath(`/fonts/${slug}`);
}

export async function deleteFont(fontId: string) {
  await requireAdmin();
  const db = await createAdminClient();

  // Best-effort: remove associated storage objects first.
  const { data: files } = await db
    .from("font_files")
    .select("storage_path, file_type")
    .eq("font_id", fontId);
  const { data: images } = await db.from("font_images").select("image_url").eq("font_id", fontId);

  if (files?.length) {
    const previewPaths = files.filter((f: any) => f.file_type === "preview").map((f: any) => f.storage_path);
    const masterPaths = files.filter((f: any) => f.file_type === "master").map((f: any) => f.storage_path);
    if (previewPaths.length) await db.storage.from(BUCKETS.previews).remove(previewPaths);
    if (masterPaths.length) await db.storage.from(BUCKETS.masters).remove(masterPaths);
  }
  if (images?.length) {
    const paths = images
      .map((i: any) => i.image_url.split(`${BUCKETS.images}/`)[1])
      .filter(Boolean) as string[];
    if (paths.length) await db.storage.from(BUCKETS.images).remove(paths);
  }

  const { error } = await db.from("fonts").delete().eq("id", fontId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/fonts");
  revalidatePath("/fonts");
  redirect("/admin/fonts");
}

// ---------------------------------------------------------------------
// Font styles
// ---------------------------------------------------------------------

export async function addFontStyle(fontId: string, formData: FormData) {
  await requireAdmin();
  const db = await createAdminClient();

  const { data: existing } = await db
    .from("font_styles")
    .select("sort_order")
    .eq("font_id", fontId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;

  const { error } = await db.from("font_styles").insert({
    font_id: fontId,
    name: String(formData.get("name") ?? "Regular"),
    weight: Number(formData.get("weight") ?? 400),
    is_italic: formData.get("is_italic") === "on",
    sort_order: nextOrder,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/fonts/${fontId}`);
}

export async function deleteFontStyle(fontId: string, styleId: string) {
  await requireAdmin();
  const db = await createAdminClient();
  const { error } = await db.from("font_styles").delete().eq("id", styleId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/fonts/${fontId}`);
}

// ---------------------------------------------------------------------
// Font files (preview = public WOFF/WOFF2, master = private OTF/TTF/ZIP)
// ---------------------------------------------------------------------

export async function uploadFontFile(fontId: string, formData: FormData) {
  await requireAdmin();
  const db = await createAdminClient();

  const file = formData.get("file") as File | null;
  const fileType = String(formData.get("file_type") ?? "preview") as FileType;
  const styleId = (formData.get("style_id") as string) || null;

  if (!file || file.size === 0) throw new Error("No file provided");

  const ext = (file.name.split(".").pop() || "").toLowerCase() as FileFormat;
  const allowed: FileFormat[] =
    fileType === "preview" ? ["woff2", "woff"] : ["otf", "ttf", "zip"];
  if (!allowed.includes(ext)) {
    throw new Error(
      `Invalid file type for ${fileType}. Expected one of: ${allowed.join(", ")}`
    );
  }

  const bucket = fileType === "preview" ? BUCKETS.previews : BUCKETS.masters;
  const path = `${fontId}/${fileType}/${nanoid(10)}-${file.name}`;

  const { error: uploadError } = await db.storage.from(bucket).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (uploadError) throw new Error(uploadError.message);

  const { error: dbError } = await db.from("font_files").insert({
    font_id: fontId,
    style_id: styleId,
    file_type: fileType,
    format: ext,
    storage_path: path,
    file_size: file.size,
  });
  if (dbError) throw new Error(dbError.message);

  revalidatePath(`/admin/fonts/${fontId}`);
  revalidatePath("/fonts");
}

export async function deleteFontFile(fontId: string, fileId: string) {
  await requireAdmin();
  const db = await createAdminClient();

  const { data: file } = await db
    .from("font_files")
    .select("storage_path, file_type")
    .eq("id", fileId)
    .single();

  if (file) {
    const bucket = file.file_type === "preview" ? BUCKETS.previews : BUCKETS.masters;
    await db.storage.from(bucket).remove([file.storage_path]);
  }

  const { error } = await db.from("font_files").delete().eq("id", fileId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/fonts/${fontId}`);
}

// ---------------------------------------------------------------------
// Gallery images + cover image
// ---------------------------------------------------------------------

export async function uploadFontImage(fontId: string, formData: FormData) {
  await requireAdmin();
  const db = await createAdminClient();

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("No file provided");

  const { count } = await db
    .from("font_images")
    .select("id", { count: "exact", head: true })
    .eq("font_id", fontId);
  if ((count ?? 0) >= MAX_GALLERY_IMAGES) {
    throw new Error(`Gallery is full — a font can have at most ${MAX_GALLERY_IMAGES} images.`);
  }

  const { data: existing } = await db
    .from("font_images")
    .select("sort_order")
    .eq("font_id", fontId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const path = `${fontId}/gallery/${nanoid(10)}-${file.name}`;
  const { error: uploadError } = await db.storage.from(BUCKETS.images).upload(path, file, {
    contentType: file.type || undefined,
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data: pub } = db.storage.from(BUCKETS.images).getPublicUrl(path);

  const { error } = await db.from("font_images").insert({
    font_id: fontId,
    image_url: pub.publicUrl,
    alt_text: String(formData.get("alt_text") ?? ""),
    sort_order: nextOrder,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/fonts/${fontId}`);
  revalidatePath(`/fonts`);
}

export async function deleteFontImage(fontId: string, imageId: string) {
  await requireAdmin();
  const db = await createAdminClient();

  const { data: image } = await db
    .from("font_images")
    .select("image_url")
    .eq("id", imageId)
    .single();
  if (image) {
    const path = image.image_url.split(`${BUCKETS.images}/`)[1];
    if (path) await db.storage.from(BUCKETS.images).remove([path]);
  }

  const { error } = await db.from("font_images").delete().eq("id", imageId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/fonts/${fontId}`);
  revalidatePath(`/fonts`);
}

export async function updateFontImageAlt(fontId: string, imageId: string, formData: FormData) {
  await requireAdmin();
  const db = await createAdminClient();

  const { error } = await db
    .from("font_images")
    .update({ alt_text: String(formData.get("alt_text") ?? "") })
    .eq("id", imageId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/fonts/${fontId}`);
}

/** Swaps sort_order with the previous/next image so gallery order can be nudged up/down. */
export async function moveFontImage(fontId: string, imageId: string, direction: "up" | "down") {
  await requireAdmin();
  const db = await createAdminClient();

  const { data: images } = await db
    .from("font_images")
    .select("id, sort_order")
    .eq("font_id", fontId)
    .order("sort_order", { ascending: true });
  if (!images) return;

  const index = images.findIndex((i: any) => i.id === imageId);
  if (index === -1) return;
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= images.length) return;

  const current = images[index];
  const swap = images[swapIndex];

  await Promise.all([
    db.from("font_images").update({ sort_order: swap.sort_order }).eq("id", current.id),
    db.from("font_images").update({ sort_order: current.sort_order }).eq("id", swap.id),
  ]);

  revalidatePath(`/admin/fonts/${fontId}`);
}

/** Promotes an existing gallery image to be the product's cover image (used on cards). */
export async function setFontImageAsCover(fontId: string, imageId: string) {
  await requireAdmin();
  const db = await createAdminClient();

  const { data: image } = await db
    .from("font_images")
    .select("image_url")
    .eq("id", imageId)
    .single();
  if (!image) throw new Error("Image not found");

  const { error } = await db
    .from("fonts")
    .update({ cover_image_url: image.image_url })
    .eq("id", fontId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/fonts/${fontId}`);
  revalidatePath("/fonts");
}

export async function uploadCoverImage(fontId: string, formData: FormData) {
  await requireAdmin();
  const db = await createAdminClient();

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("No file provided");

  const path = `${fontId}/cover/${nanoid(10)}-${file.name}`;
  const { error: uploadError } = await db.storage.from(BUCKETS.images).upload(path, file, {
    contentType: file.type || undefined,
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data: pub } = db.storage.from(BUCKETS.images).getPublicUrl(path);

  const { error } = await db
    .from("fonts")
    .update({ cover_image_url: pub.publicUrl })
    .eq("id", fontId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/fonts/${fontId}`);
  revalidatePath("/fonts");
}

// ---------------------------------------------------------------------
// License prices
// ---------------------------------------------------------------------

export async function setLicensePrice(
  fontId: string,
  licenseId: string,
  price: number,
  currency: string
) {
  await requireAdmin();
  const db = await createAdminClient();

  const { error } = await db
    .from("license_prices")
    .upsert(
      { font_id: fontId, license_id: licenseId, price, currency },
      { onConflict: "font_id,license_id" }
    );
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/fonts/${fontId}`);
  revalidatePath("/fonts");
}

export async function removeLicensePrice(fontId: string, licenseId: string) {
  await requireAdmin();
  const db = await createAdminClient();
  const { error } = await db
    .from("license_prices")
    .delete()
    .eq("font_id", fontId)
    .eq("license_id", licenseId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/fonts/${fontId}`);
}
