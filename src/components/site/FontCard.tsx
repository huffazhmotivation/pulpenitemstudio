import Image from "next/image";
import Link from "next/link";
import type { FontWithRelations } from "@/lib/types/database";
import { LiveFontPreview } from "@/components/site/LiveFontPreview";
import { StampBadge } from "@/components/ui/Badge";
import { formatPrice, isSaleActive, getDiscountPercent } from "@/lib/utils";
import { publicStorageUrl, BUCKETS } from "@/lib/storage";

export function FontCard({ font }: { font: FontWithRelations }) {
  const coverImage = font.cover_image_url ?? font.images[0]?.image_url ?? null;

  const regularStyle = font.styles.find((s) => s.weight === 400 && !s.is_italic) ?? font.styles[0];
  const previewFile = font.files.find(
    (f) => f.file_type === "preview" && (regularStyle ? f.style_id === regularStyle.id : true)
  ) ?? font.files.find((f) => f.file_type === "preview");
  const woff2Url = previewFile ? publicStorageUrl(BUCKETS.previews, previewFile.storage_path) : null;

  const onSale = isSaleActive(font);
  const fromPrice =
    font.license_prices.length > 0
      ? Math.min(...font.license_prices.map((lp) => lp.price))
      : font.price;
  const salePrice = onSale ? (font.sale_price as number) : null;
  const discount = onSale && salePrice !== null ? getDiscountPercent(fromPrice, salePrice) : 0;

  const styleCount = font.styles.length;

  return (
    <Link
      href={`/fonts/${font.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] backdrop-blur-xl transition-all duration-200 hover:border-signal/40 hover:bg-white/[0.07] hover:shadow-[0_8px_28px_-8px_rgba(163,230,53,0.25)]"
      style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 8px 32px -12px rgba(0,0,0,0.5)" }}
    >
      {/* Product image — dominant, image-first */}
      <div className="scan-sweep relative aspect-[4/3] w-full bg-paper-dim">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={`${font.name} cover`}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-6">
            <LiveFontPreview
              fontFamily={`preview-${font.slug}`}
              woff2Url={woff2Url}
              text="Aa"
              fontSize={96}
              className="text-ink"
            />
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {font.is_new && <StampBadge variant="new">New</StampBadge>}
          {onSale && <StampBadge variant="sale">Sale</StampBadge>}
          {font.is_featured && !onSale && <StampBadge variant="featured">Featured</StampBadge>}
        </div>
        {onSale && discount > 0 && (
          <div className="absolute right-3 top-3">
            <span className="pill bg-panel text-sale shadow-sm">-{discount}%</span>
          </div>
        )}
      </div>

      {/* Metadata footer */}
      <div className="flex flex-1 flex-col gap-2 border-t border-white/10 bg-white/[0.03] px-4 py-4 backdrop-blur-sm">
        <div className="min-w-0">
          <p className="eyebrow truncate">
            {font.category?.name ?? "Uncategorised"} · {styleCount} style{styleCount === 1 ? "" : "s"}
          </p>
          <p className="mt-1 truncate font-display text-base font-semibold text-ink">{font.name}</p>
        </div>

        <div className="mt-auto flex items-baseline gap-2 pt-1">
          {onSale && salePrice !== null ? (
            <>
              <span className="font-mono text-sm font-semibold text-sale">{formatPrice(salePrice, font.currency)}</span>
              <span className="font-mono text-xs text-ink-faint line-through">{formatPrice(fromPrice, font.currency)}</span>
            </>
          ) : (
            <span className="font-mono text-sm font-semibold text-ink">from {formatPrice(fromPrice, font.currency)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
