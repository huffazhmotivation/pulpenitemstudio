import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatPrice(amount: number, currency: string = "USD"): string {
  if (currency === "IDR") {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * A font's sale is "active" only when the toggle is on, a valid sale
 * price is set below the regular price, and — if dates are set — the
 * current time falls inside the sale window. Optional dates mean an
 * always-on sale until manually toggled off.
 */
export function isSaleActive(font: {
  is_on_sale: boolean;
  price: number;
  sale_price: number | null;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
}): boolean {
  if (!font.is_on_sale) return false;
  if (font.sale_price === null || font.sale_price === undefined) return false;
  if (font.sale_price <= 0 || font.sale_price >= font.price) return false;

  const now = Date.now();
  if (font.sale_starts_at && now < new Date(font.sale_starts_at).getTime()) return false;
  if (font.sale_ends_at && now > new Date(font.sale_ends_at).getTime()) return false;
  return true;
}

/** The price to actually charge/display as the "current" price. */
export function getEffectivePrice(font: {
  price: number;
  sale_price: number | null;
  is_on_sale: boolean;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
}): number {
  return isSaleActive(font) ? (font.sale_price as number) : font.price;
}

/** Whole-number percent off, e.g. 250000 -> 199000 = 20% off. */
export function getDiscountPercent(regular: number, sale: number): number {
  if (!regular || regular <= 0 || sale >= regular) return 0;
  return Math.round(((regular - sale) / regular) * 100);
}

export const MAX_GALLERY_IMAGES = 10;

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}
