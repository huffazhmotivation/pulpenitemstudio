import { createClient, escapeLike } from "@/lib/db";
import type {
  Category,
  FontWithRelations,
  HeroImage,
  HomepageSettings,
  License,
  SiteSettings,
} from "@/lib/types/database";

const FONT_SELECT = `
  *,
  category:categories(*),
  styles:font_styles(*),
  files:font_files(*),
  images:font_images(*),
  license_prices(*, license:licenses(*))
`;

/** Strips private (master) files before this record ever reaches a client component. */
function stripMasterFiles(font: any): FontWithRelations {
  return {
    ...font,
    files: (font.files ?? []).filter((f: any) => f.file_type === "preview"),
  };
}

export async function getPublishedFonts(opts?: {
  categorySlug?: string;
  search?: string;
}): Promise<FontWithRelations[]> {
  const db = await createClient();
  let query = db
    .from("fonts")
    .select(FONT_SELECT)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (opts?.categorySlug) {
    const { data: cat } = await db
      .from("categories")
      .select("id")
      .eq("slug", opts.categorySlug)
      .single();
    if (cat) query = query.eq("category_id", cat.id);
  }

  if (opts?.search) {
    // Commas/braces would break the or() expression; LIKE wildcards are escaped.
    const term = opts.search.replace(/[,{}()]/g, " ").trim();
    if (term) {
      query = query.or(
        `name.ilike.%${escapeLike(term)}%,short_description.ilike.%${escapeLike(term)}%,tags.cs.{${term}}`
      );
    }
  }

  const { data, error } = await query;
  if (error) {
    console.error("getPublishedFonts error", error);
    return [];
  }
  return (data ?? []).map(stripMasterFiles);
}

export async function getFeaturedFonts(limit = 4): Promise<FontWithRelations[]> {
  const db = await createClient();
  const { data } = await db
    .from("fonts")
    .select(FONT_SELECT)
    .eq("status", "published")
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map(stripMasterFiles);
}

export async function getOnSaleFonts(limit = 8): Promise<FontWithRelations[]> {
  const db = await createClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await db
    .from("fonts")
    .select(FONT_SELECT)
    .eq("status", "published")
    .eq("is_on_sale", true)
    .not("sale_price", "is", null)
    .or(`sale_starts_at.is.null,sale_starts_at.lte.${nowIso}`)
    .or(`sale_ends_at.is.null,sale_ends_at.gte.${nowIso}`)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("getOnSaleFonts error", error);
    return [];
  }
  return (data ?? []).map(stripMasterFiles);
}

export async function getLatestFonts(limit = 8): Promise<FontWithRelations[]> {
  const db = await createClient();
  const { data } = await db
    .from("fonts")
    .select(FONT_SELECT)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map(stripMasterFiles);
}

export async function getFontBySlug(
  slug: string
): Promise<FontWithRelations | null> {
  const db = await createClient();
  const { data, error } = await db
    .from("fonts")
    .select(FONT_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  if (error || !data) return null;
  return stripMasterFiles(data);
}

export async function getRelatedFonts(
  font: FontWithRelations,
  limit = 4
): Promise<FontWithRelations[]> {
  const db = await createClient();
  const { data } = await db
    .from("fonts")
    .select(FONT_SELECT)
    .eq("status", "published")
    .eq("category_id", font.category_id ?? "")
    .neq("id", font.id)
    .limit(limit);
  return (data ?? []).map(stripMasterFiles);
}

/**
 * Pulls gallery images across published fonts for the homepage "Font in
 * Use" showcase — same underlying font_images rows the admin already
 * manages per-font, just aggregated for display.
 */
export async function getShowcaseImages(limit = 9): Promise<
  { id: string; image_url: string; alt_text: string | null; font: { name: string; slug: string } }[]
> {
  const db = await createClient();
  const { data: fonts } = await db.from("fonts").select("id, name, slug").eq("status", "published");
  const byId = new Map<string, { name: string; slug: string }>(
    (fonts ?? []).map((f: any) => [f.id, { name: f.name, slug: f.slug }])
  );
  if (byId.size === 0) return [];
  const { data, error } = await db
    .from("font_images")
    .select("*")
    .in("font_id", Array.from(byId.keys()).slice(0, 90))
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("getShowcaseImages error", error);
    return [];
  }
  return (data ?? []).map((row: any) => ({
    id: row.id,
    image_url: row.image_url,
    alt_text: row.alt_text,
    font: byId.get(row.font_id)!,
  }));
}

export async function getCategories(): Promise<Category[]> {
  const db = await createClient();
  const { data } = await db
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  return data ?? [];
}

/**
 * Categories enriched with a published-font count and one representative
 * cover image, for the homepage's image-led "Browse Categories" section.
 */
export async function getCategoriesWithPreview(): Promise<
  (Category & { fontCount: number; previewImage: string | null })[]
> {
  const db = await createClient();
  const [{ data: categories }, { data: fonts }] = await Promise.all([
    db.from("categories").select("*").order("sort_order", { ascending: true }),
    db
      .from("fonts")
      .select("category_id, cover_image_url")
      .eq("status", "published")
      .not("category_id", "is", null),
  ]);

  return (categories ?? []).map((cat: any) => {
    const inCategory = (fonts ?? []).filter((f: any) => f.category_id === cat.id);
    const withImage = inCategory.find((f: any) => f.cover_image_url);
    return {
      ...cat,
      fontCount: inCategory.length,
      previewImage: withImage?.cover_image_url ?? null,
    };
  });
}

export async function getLicenses(): Promise<License[]> {
  const db = await createClient();
  const { data } = await db
    .from("licenses")
    .select("*")
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const db = await createClient();
  const { data } = await db
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();
  return (
    data ?? {
      id: 1,
      studio_name: "Pulpenitem Studio",
      studio_tagline: "An independent type foundry.",
      contact_email: null,
      whatsapp_number: null,
      instagram_handle: null,
      address: null,
      footer_note: null,
      logo_url: null,
      favicon_url: null,
    }
  );
}

export async function getHeroImages(): Promise<HeroImage[]> {
  const db = await createClient();
  const { data } = await db
    .from("hero_images")
    .select("*")
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function getHomepageSettings(): Promise<HomepageSettings> {
  const db = await createClient();
  const { data } = await db
    .from("homepage_settings")
    .select("*")
    .eq("id", 1)
    .single();
  return (
    data ?? {
      id: 1,
      hero_eyebrow: "Pulpenitem Studio",
      hero_heading: "Type, made with intent.",
      hero_subheading:
        "An independent foundry drawing display and text typefaces for editorial, branding, and product work.",
      hero_preview_font_id: null,
      hero_preview_text: "Pulpenitem",
      about_heading: "A small studio, drawn by hand.",
      about_body:
        "Pulpenitem Studio is an independent type foundry designing considered, characterful typefaces for editorial, branding, and product work.",
      featured_heading: "Featured",
      latest_heading: "Latest releases",
    }
  );
}

/**
 * A few published fonts (name + public preview file URL only) for the footer's
 * kerning game. Deliberately tiny so it can run on every page.
 */
export async function getGameFonts(limit = 8): Promise<{ name: string; woff2Path: string }[]> {
  const db = await createClient();
  const { data } = await db
    .from("fonts")
    .select("name, files:font_files(file_type, storage_path)")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);
  const out: { name: string; woff2Path: string }[] = [];
  for (const f of (data ?? []) as { name: string; files: { file_type: string; storage_path: string }[] | null }[]) {
    const prev = (f.files ?? []).find((x) => x.file_type === "preview");
    if (prev) out.push({ name: f.name, woff2Path: prev.storage_path });
  }
  return out;
}
