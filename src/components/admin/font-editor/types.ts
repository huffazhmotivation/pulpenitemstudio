import type { FontRow, FontStatus } from "@/lib/types/database";

/** Controlled-form mirror of the editable fields on the `fonts` row. */
export interface CoreFields {
  name: string;
  slug: string;
  short_description: string;
  full_description: string;
  category_id: string;
  tags: string;
  designer: string;
  release_year: string;
  version: string;
  language_support: string;
  font_features: string;
  default_preview_text: string;
  price: string;
  currency: string;
  is_on_sale: boolean;
  sale_price: string;
  sale_starts_at: string;
  sale_ends_at: string;
  status: FontStatus;
  is_featured: boolean;
  is_new: boolean;
  seo_title: string;
  meta_description: string;
}

export function fontToCoreFields(font: FontRow): CoreFields {
  return {
    name: font.name ?? "",
    slug: font.slug ?? "",
    short_description: font.short_description ?? "",
    full_description: font.full_description ?? "",
    category_id: font.category_id ?? "",
    tags: font.tags?.join(", ") ?? "",
    designer: font.designer ?? "",
    release_year: font.release_year != null ? String(font.release_year) : "",
    version: font.version ?? "1.0",
    language_support: font.language_support?.join(", ") ?? "",
    font_features: font.font_features?.join(", ") ?? "",
    default_preview_text: font.default_preview_text ?? "The quick brown fox jumps over the lazy dog",
    price: font.price != null ? String(font.price) : "0",
    currency: font.currency ?? "USD",
    is_on_sale: !!font.is_on_sale,
    sale_price: font.sale_price != null ? String(font.sale_price) : "",
    sale_starts_at: font.sale_starts_at ? font.sale_starts_at.slice(0, 16) : "",
    sale_ends_at: font.sale_ends_at ? font.sale_ends_at.slice(0, 16) : "",
    status: font.status ?? "draft",
    is_featured: !!font.is_featured,
    is_new: !!font.is_new,
    seo_title: font.seo_title ?? "",
    meta_description: font.meta_description ?? "",
  };
}

export function coreFieldsToFormData(values: CoreFields): FormData {
  const fd = new FormData();
  fd.set("name", values.name);
  fd.set("slug", values.slug);
  fd.set("short_description", values.short_description);
  fd.set("full_description", values.full_description);
  fd.set("category_id", values.category_id);
  fd.set("tags", values.tags);
  fd.set("designer", values.designer);
  fd.set("release_year", values.release_year);
  fd.set("version", values.version);
  fd.set("language_support", values.language_support);
  fd.set("font_features", values.font_features);
  fd.set("default_preview_text", values.default_preview_text);
  fd.set("price", values.price);
  fd.set("currency", values.currency);
  fd.set("sale_price", values.sale_price);
  fd.set("sale_starts_at", values.sale_starts_at);
  fd.set("sale_ends_at", values.sale_ends_at);
  fd.set("status", values.status);
  fd.set("seo_title", values.seo_title);
  fd.set("meta_description", values.meta_description);
  if (values.is_on_sale) fd.set("is_on_sale", "on");
  if (values.is_featured) fd.set("is_featured", "on");
  if (values.is_new) fd.set("is_new", "on");
  return fd;
}
