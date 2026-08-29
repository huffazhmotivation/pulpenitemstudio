export type FontStatus = "draft" | "published";
export type FileType = "preview" | "master";
export type FileFormat = "woff2" | "woff" | "otf" | "ttf" | "zip";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface License {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface FontRow {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  full_description: string | null;
  category_id: string | null;
  tags: string[];
  designer: string | null;
  release_year: number | null;
  version: string | null;
  language_support: string[];
  font_features: string[];
  price: number;
  currency: string;
  sale_price: number | null;
  is_on_sale: boolean;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
  status: FontStatus;
  is_featured: boolean;
  is_new: boolean;
  cover_image_url: string | null;
  default_preview_text: string | null;
  seo_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface FontStyle {
  id: string;
  font_id: string;
  name: string;
  weight: number;
  is_italic: boolean;
  sort_order: number;
  created_at: string;
}

export interface FontFile {
  id: string;
  font_id: string;
  style_id: string | null;
  file_type: FileType;
  format: FileFormat;
  storage_path: string;
  file_size: number | null;
  created_at: string;
}

export interface FontImage {
  id: string;
  font_id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
}

export interface LicensePrice {
  id: string;
  font_id: string;
  license_id: string;
  price: number;
  currency: string;
  created_at: string;
}

export interface SiteSettings {
  id: number;
  studio_name: string;
  studio_tagline: string | null;
  contact_email: string | null;
  whatsapp_number: string | null;
  instagram_handle: string | null;
  address: string | null;
  footer_note: string | null;
  logo_url: string | null;
  favicon_url: string | null;
}

export interface HeroImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
}

export interface HomepageSettings {
  id: number;
  hero_eyebrow: string | null;
  hero_heading: string | null;
  hero_subheading: string | null;
  hero_preview_font_id: string | null;
  hero_preview_text: string | null;
  /** Admin-uploaded hero image (full-bleed background). When set, this
   *  replaces the auto-generated product photo slider on the homepage. */
  hero_image_url: string | null;
  hero_image_alt: string | null;
  about_heading: string | null;
  about_body: string | null;
  featured_heading: string | null;
  latest_heading: string | null;
}

export interface AdminProfile {
  id: string;
  full_name: string | null;
  role: "admin" | "owner";
  created_at: string;
}

/** A font with its relations joined, as used throughout the public site. */
export interface FontWithRelations extends FontRow {
  category: Category | null;
  styles: FontStyle[];
  files: FontFile[];
  images: FontImage[];
  license_prices: (LicensePrice & { license: License })[];
}
