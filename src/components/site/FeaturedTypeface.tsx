import Image from "next/image";
import { LiveFontPreview } from "@/components/site/LiveFontPreview";
import { StampBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import type { FontWithRelations } from "@/lib/types/database";
import { publicStorageUrl, BUCKETS } from "@/lib/storage";
import { formatPrice } from "@/lib/utils";

export function FeaturedTypeface({ font }: { font: FontWithRelations }) {
  const previewFile = font.files.find((f) => f.file_type === "preview");
  const woff2Url = previewFile ? publicStorageUrl(BUCKETS.previews, previewFile.storage_path) : null;
  const image = font.images[0]?.image_url ?? font.cover_image_url;
  const fromPrice =
    font.license_prices.length > 0
      ? Math.min(...font.license_prices.map((lp) => lp.price))
      : font.price;
  const styles = [...font.styles].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-grid px-6 py-16 md:px-10 md:py-24">
        <p className="eyebrow-accent mb-6">Featured typeface</p>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Text column */}
          <div className="flex flex-col justify-between">
            <div>
              <LiveFontPreview
                fontFamily={`preview-${font.slug}`}
                woff2Url={woff2Url}
                text={font.name}
                as="h2"
                className="text-ink [font-size:clamp(2.75rem,6.5vw,5.5rem)] leading-[0.94] tracking-tight break-words"
              />
              {font.short_description && (
                <p className="mt-6 max-w-md text-lg text-ink-soft">{font.short_description}</p>
              )}

              <div className="mt-8 flex flex-wrap gap-2">
                {styles.slice(0, 6).map((s) => (
                  <span
                    key={s.id}
                    className="border border-line px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft"
                  >
                    {s.name}
                  </span>
                ))}
                {styles.length > 6 && (
                  <span className="border border-line px-3 py-1 font-mono text-[11px] text-ink-soft">
                    +{styles.length - 6} more
                  </span>
                )}
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-line pt-6">
              <div>
                <p className="eyebrow mb-1">From</p>
                <p className="font-display text-2xl text-ink">{formatPrice(fromPrice, font.currency)}</p>
              </div>
              <ButtonLink href={`/fonts/${font.slug}`} variant="primary" size="lg">
                View specimen
              </ButtonLink>
            </div>
          </div>

          {/* Image column */}
          <div className="relative aspect-[4/5] w-full overflow-hidden border border-line bg-paper-dim/40 sm:aspect-[5/4] lg:aspect-auto">
            {image ? (
              <Image
                src={image}
                alt={`${font.name} specimen`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full min-h-[320px] items-center justify-center">
                <LiveFontPreview
                  fontFamily={`preview-${font.slug}`}
                  woff2Url={woff2Url}
                  text="Aa"
                  fontSize={160}
                  className="text-ink-soft/40"
                />
              </div>
            )}
            <StampBadge className="absolute left-4 top-4 bg-paper">{font.category?.name ?? "Specimen"}</StampBadge>
          </div>
        </div>
      </div>
    </section>
  );
}
