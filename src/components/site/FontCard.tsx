"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { FontWithRelations } from "@/lib/types/database";
import { FontSlide, SLIDE_KINDS, tintFor, type SlideKind } from "@/components/site/FontMockup";
import { StampBadge } from "@/components/ui/Badge";
import { useFontFace } from "@/lib/useFontFace";
import { useCart } from "@/lib/cart/CartContext";
import { publicStorageUrl, BUCKETS } from "@/lib/storage";
import { cn, formatPrice, getDiscountPercent, isSaleActive } from "@/lib/utils";

type Slide = { type: "img"; src: string; alt: string } | { type: "mock"; kind: SlideKind };

/** Which composition a card opens on, so a grid of cards looks varied. */
function baseKind(id: string): SlideKind {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return (["poster", "cover", "pack", "sign"] as SlideKind[])[Math.abs(h) % 4];
}

export function FontCard({ font, text }: { font: FontWithRelations; text?: string }) {
  const { addItems, isInCart } = useCart();
  const coverImage = font.cover_image_url ?? font.images[0]?.image_url ?? null;

  const regularStyle = font.styles.find((s) => s.weight === 400 && !s.is_italic) ?? font.styles[0];
  const previewFile =
    font.files.find((f) => f.file_type === "preview" && (regularStyle ? f.style_id === regularStyle.id : true)) ??
    font.files.find((f) => f.file_type === "preview");
  const woff2Url = previewFile ? publicStorageUrl(BUCKETS.previews, previewFile.storage_path) : null;
  const { family, ref } = useFontFace<HTMLDivElement>(`card-${font.slug}`, woff2Url);

  const slides: Slide[] = [
    ...(coverImage ? [{ type: "img", src: coverImage, alt: `${font.name} cover` } as Slide] : []),
    ...SLIDE_KINDS.map((kind) => ({ type: "mock", kind }) as Slide),
  ];
  const base = coverImage ? 0 : slides.findIndex((s) => s.type === "mock" && s.kind === baseKind(font.id));
  const [idx, setIdx] = useState(base);

  const onSale = isSaleActive(font);
  const lowest = font.license_prices.length
    ? font.license_prices.reduce((a, b) => (b.price < a.price ? b : a))
    : null;
  const fromPrice = lowest ? lowest.price : font.price;
  const salePrice = onSale ? (font.sale_price as number) : null;
  const discount = onSale && salePrice !== null ? getDiscountPercent(fromPrice, salePrice) : 0;
  const tint = tintFor(font.slug);
  const category = font.category?.name ?? "Uncategorised";
  const styleCount = font.styles.length;
  const cartId = lowest ? `${font.slug}:${lowest.license_id}` : null;
  const inCart = cartId ? isInCart(cartId) : false;

  const current = slides[idx] ?? slides[0];

  function scrub(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const k = Math.max(0, Math.min(slides.length - 1, Math.floor(((e.clientX - r.left) / r.width) * slides.length)));
    if (k !== idx) setIdx(k);
  }

  return (
    <article className="group relative flex min-w-0 flex-col rounded-xl bg-panel p-2.5 pb-4 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lift">
      <Link href={`/fonts/${font.slug}`} className="absolute inset-0 z-10 rounded-xl" aria-label={`Open ${font.name}`} />

      {/* Move the pointer across the picture to flip through its previews */}
      <div
        ref={ref}
        onPointerMove={scrub}
        onPointerLeave={() => setIdx(base)}
        className="relative overflow-hidden rounded-lg bg-paper-dim"
      >
        {current.type === "img" ? (
          <div className="relative aspect-[4/3] w-full">
            <Image
              src={current.src}
              alt={current.alt}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          </div>
        ) : (
          <FontSlide kind={current.kind} family={family} name={font.name} category={category} tint={tint} text={text} />
        )}

        <div className="pointer-events-none absolute left-3 top-3 z-20 flex gap-1.5">
          {font.is_new && <StampBadge variant="new">New</StampBadge>}
          {onSale && discount > 0 && <StampBadge variant="sale">−{discount}%</StampBadge>}
          {font.is_featured && !onSale && !font.is_new && <StampBadge variant="featured">Featured</StampBadge>}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-2.5 z-20 flex justify-center gap-1.5">
          {slides.map((_, i) => (
            <i
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === idx ? "w-3.5 bg-ink" : "w-1.5 bg-ink/25"
              )}
            />
          ))}
        </div>
      </div>

      <div className="mt-3.5 flex items-end justify-between gap-3 px-2.5">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold tracking-tight text-ink">{font.name}</h3>
          <p className="truncate text-[13px] text-ink-soft">
            {category} · {styleCount} style{styleCount === 1 ? "" : "s"}
          </p>
          <p className="mt-2 text-[15px] font-bold text-ink">
            {onSale && salePrice !== null ? (
              <>
                {formatPrice(salePrice, font.currency)}
                <span className="ml-1.5 text-xs font-medium text-ink-faint line-through">
                  {formatPrice(fromPrice, font.currency)}
                </span>
              </>
            ) : (
              <>from {formatPrice(fromPrice, font.currency)}</>
            )}
          </p>
        </div>

        {lowest && cartId && (
          <button
            type="button"
            aria-label={inCart ? `${font.name} is in your cart` : `Add ${font.name} to cart`}
            onClick={() =>
              addItems([
                {
                  id: cartId,
                  fontName: font.name,
                  fontSlug: font.slug,
                  licenseId: lowest.license_id,
                  licenseName: lowest.license.name,
                  price: lowest.price,
                  currency: font.currency,
                },
              ])
            }
            className={cn(
              "relative z-20 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-all hover:scale-105",
              inCart ? "bg-signal" : "bg-ink hover:bg-signal"
            )}
          >
            {inCart ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h2.5l2.3 11h10.4l2-8H6.5" /><circle cx="9" cy="20" r="1.3" /><circle cx="17" cy="20" r="1.3" /></svg>
            )}
          </button>
        )}
      </div>
    </article>
  );
}
