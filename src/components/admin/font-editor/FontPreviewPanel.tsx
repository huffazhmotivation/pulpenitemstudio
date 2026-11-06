"use client";

import { useMemo, useState } from "react";
import { FontSlide, SLIDE_KINDS, SLIDE_LABELS, tintFor, type SlideKind } from "@/components/site/FontMockup";
import { useFontFace } from "@/lib/useFontFace";
import { BUCKETS, publicStorageUrl } from "@/lib/storage";
import { cn, formatPrice, getDiscountPercent, isSaleActive } from "@/lib/utils";
import type { Category, FontFile, FontImage, FontStyle, LicensePrice } from "@/lib/types/database";
import type { CoreFields } from "./types";

type Mode = "card" | "page";
type Look = "photo" | SlideKind;

function list(csv: string): string[] {
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * A live, read-only preview of how this font looks on the storefront. It reads
 * the same state the form edits, so every keystroke shows up here at once.
 */
export function FontPreviewPanel({
  fontId,
  values,
  categories,
  styles,
  files,
  images,
  coverImageUrl,
  licensePrices,
}: {
  fontId: string;
  values: CoreFields;
  categories: Category[];
  styles: FontStyle[];
  files: FontFile[];
  images: FontImage[];
  coverImageUrl: string | null;
  licensePrices: LicensePrice[];
}) {
  const [mode, setMode] = useState<Mode>("card");
  const cover = coverImageUrl ?? images[0]?.image_url ?? null;
  const [look, setLook] = useState<Look>(cover ? "photo" : "cover");

  const regularStyle = styles.find((s) => s.weight === 400 && !s.is_italic) ?? styles[0];
  const previewFile =
    files.find((f) => f.file_type === "preview" && (regularStyle ? f.style_id === regularStyle.id : true)) ??
    files.find((f) => f.file_type === "preview");
  const woff2Url = previewFile ? publicStorageUrl(BUCKETS.previews, previewFile.storage_path) : null;
  const { family, ref } = useFontFace<HTMLDivElement>(`admin-${fontId}`, woff2Url, true);

  const name = values.name.trim() || "Untitled font";
  const category = categories.find((c) => c.id === values.category_id)?.name ?? "Uncategorised";
  const price = Number(values.price) || 0;
  const salePrice = values.sale_price === "" ? null : Number(values.sale_price);
  const currency = values.currency || "USD";

  const lowest = licensePrices.length ? licensePrices.reduce((a, b) => (b.price < a.price ? b : a)) : null;
  const fromPrice = lowest ? lowest.price : price;
  const onSale = isSaleActive({
    is_on_sale: values.is_on_sale,
    price,
    sale_price: salePrice !== null && !Number.isNaN(salePrice) ? salePrice : null,
    sale_starts_at: values.sale_starts_at ? new Date(values.sale_starts_at).toISOString() : null,
    sale_ends_at: values.sale_ends_at ? new Date(values.sale_ends_at).toISOString() : null,
  });
  const discount = onSale && salePrice !== null ? getDiscountPercent(fromPrice, salePrice) : 0;

  const tags = useMemo(() => list(values.tags), [values.tags]);
  const languages = useMemo(() => list(values.language_support), [values.language_support]);
  const features = useMemo(() => list(values.font_features), [values.font_features]);
  const tint = tintFor(values.slug || name);
  const sampleText = values.default_preview_text.trim() || name;
  const fontStack = family ? `"${family}", system-ui` : "system-ui";

  const looks: { id: Look; label: string }[] = [
    ...(cover ? [{ id: "photo" as Look, label: "Photo" }] : []),
    ...SLIDE_KINDS.map((k) => ({ id: k as Look, label: SLIDE_LABELS[k] })),
  ];

  const priceNode =
    onSale && salePrice !== null ? (
      <>
        {formatPrice(salePrice, currency)}
        <span className="ml-1.5 text-xs font-medium text-ink-faint line-through">{formatPrice(fromPrice, currency)}</span>
      </>
    ) : (
      <>from {formatPrice(fromPrice, currency)}</>
    );

  return (
    <aside aria-label="Live preview" className="rounded-2xl bg-panel p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
          </span>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-soft">Live preview</p>
        </div>
        <div className="flex rounded-full bg-paper p-1">
          {(["card", "page"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors",
                mode === m ? "bg-ink text-white" : "text-ink-soft hover:text-ink"
              )}
            >
              {m === "card" ? "Card" : "Product page"}
            </button>
          ))}
        </div>
      </div>

      {mode === "card" ? (
        <div>
          <article className="rounded-xl bg-panel p-2.5 pb-4 shadow-card ring-1 ring-line">
            <div ref={ref} className="relative overflow-hidden rounded-lg bg-paper-dim">
              {look === "photo" && cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt="" className="aspect-[4/3] w-full object-cover" />
              ) : (
                <FontSlide
                  kind={(look === "photo" ? "cover" : look) as SlideKind}
                  family={family}
                  name={name}
                  category={category}
                  tint={tint}
                  text={sampleText}
                />
              )}
              <div className="pointer-events-none absolute left-3 top-3 z-20 flex gap-1.5">
                {values.is_new && <span className="pill bg-ink text-white">New</span>}
                {onSale && discount > 0 && <span className="pill bg-yellow text-ink">−{discount}%</span>}
                {values.is_featured && !onSale && !values.is_new && <span className="pill bg-signal text-white">Featured</span>}
              </div>
            </div>
            <div className="mt-3.5 px-2.5">
              <h3 className="truncate text-base font-bold tracking-tight text-ink">{name}</h3>
              <p className="truncate text-[13px] text-ink-soft">
                {category} · {styles.length} style{styles.length === 1 ? "" : "s"}
              </p>
              <p className="mt-2 text-[15px] font-bold text-ink">{priceNode}</p>
            </div>
          </article>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {looks.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLook(l.id)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  look === l.id ? "bg-ink text-white" : "bg-paper text-ink-soft hover:text-ink"
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div ref={ref} className="space-y-4 rounded-xl bg-paper p-4">
          <div className="rounded-lg bg-panel p-4" style={{ background: tint }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink/60">{category}</p>
            <h2
              className="mt-1 break-words text-4xl leading-[1.05] text-ink"
              style={{ fontFamily: fontStack, fontWeight: 400 }}
            >
              {name}
            </h2>
            <p className="mt-3 break-words text-2xl leading-tight text-ink" style={{ fontFamily: fontStack }}>
              {sampleText}
            </p>
          </div>

          {values.short_description && <p className="text-sm text-ink-soft">{values.short_description}</p>}

          <div className="flex items-center justify-between rounded-lg bg-panel p-3">
            <p className="text-lg font-bold text-ink">{priceNode}</p>
            <span className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white">Order</span>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span key={t} className="rounded-full bg-panel px-2.5 py-1 text-[11px] font-semibold text-ink-soft">
                  {t}
                </span>
              ))}
            </div>
          )}

          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg bg-panel p-3 text-xs">
            {[
              ["Designer", values.designer],
              ["Year", values.release_year],
              ["Version", values.version],
              ["Styles", String(styles.length)],
              ["Languages", languages.join(", ")],
              ["Features", features.join(", ")],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="font-semibold uppercase tracking-[0.06em] text-ink-faint">{k}</dt>
                  <dd className="break-words text-ink">{v}</dd>
                </div>
              ))}
          </dl>

          <p className="break-words text-xl leading-snug text-ink" style={{ fontFamily: fontStack }}>
            Aa Bb Cc Dd Ee Ff Gg Hh 0123456789
          </p>
        </div>
      )}

      {!woff2Url && (
        <p className="mt-3 rounded-lg bg-yellow-soft px-3 py-2 text-xs text-ink-soft">
          Upload a preview font (WOFF/WOFF2) in the Font Files tab to see your typeface here.
        </p>
      )}
      <p className="mt-3 text-[11px] text-ink-faint">Updates as you type. Nothing is saved until you press Save or Publish.</p>
    </aside>
  );
}
