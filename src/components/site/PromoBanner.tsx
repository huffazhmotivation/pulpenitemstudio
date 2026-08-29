import { LiveFontPreview } from "@/components/site/LiveFontPreview";
import { HeroProductSlider } from "@/components/site/HeroProductSlider";
import { HeroSlider } from "@/components/site/HeroSlider";
import { StampBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import type { FontWithRelations, HeroImage, HomepageSettings } from "@/lib/types/database";
import { publicStorageUrl, BUCKETS } from "@/lib/storage";
import { formatPrice, isSaleActive, getDiscountPercent } from "@/lib/utils";

/**
 * Homepage hero — a full-width (max-w-grid) product gallery running as
 * the background, with a fixed caption block anchored on the left and a
 * left-to-right gradient scrim so the text stays readable no matter which
 * slide is showing. The caption itself doesn't change between slides —
 * only the photography behind it rotates.
 */
export function PromoBanner({
  homepage,
  font,
  galleryFonts = [],
  heroImages = [],
}: {
  homepage: HomepageSettings;
  font: FontWithRelations | null;
  /** Extra products shown in the auto-sliding background gallery. */
  galleryFonts?: FontWithRelations[];
  /** Admin-managed hero gallery — takes priority over the product slider. */
  heroImages?: HeroImage[];
}) {
  // Admin-managed hero gallery takes priority over everything else —
  // one or more images, auto-sliding, fully controlled from
  // /admin/homepage. Falls back to the single legacy hero_image_url
  // as a one-slide gallery so nothing already configured disappears.
  const gallerySlides =
    heroImages.length > 0
      ? heroImages.map((img) => ({ id: img.id, imageUrl: img.image_url, alt: img.alt_text || homepage.hero_heading || "Pulpenitem Studio" }))
      : homepage.hero_image_url
        ? [{ id: "legacy", imageUrl: homepage.hero_image_url, alt: homepage.hero_image_alt || homepage.hero_heading || "Pulpenitem Studio" }]
        : [];

  if (gallerySlides.length > 0) {
    return (
      <section className="border-b border-line bg-paper-dim">
        <div className="relative mx-auto h-[440px] max-w-grid overflow-hidden sm:h-[480px] md:h-[520px] lg:h-[580px]">
          <HeroSlider slides={gallerySlides} />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, #161616 0%, rgba(22,22,22,0.94) 32%, rgba(22,22,22,0.55) 56%, rgba(22,22,22,0.08) 78%, transparent 100%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 sm:hidden"
            style={{
              background:
                "linear-gradient(180deg, rgba(22,22,22,0.2) 0%, rgba(22,22,22,0.75) 65%, rgba(22,22,22,0.92) 100%)",
            }}
          />

          <div className="relative z-10 flex h-full items-end px-6 pb-14 pt-10 sm:items-center sm:pb-10 md:px-10">
            <div className="max-w-md">
              <p className="eyebrow-accent mb-3">{homepage.hero_eyebrow}</p>
              <h1 className="font-display text-ink [font-size:clamp(1.9rem,4.2vw,3rem)] leading-[1.05] tracking-tight break-words">
                {homepage.hero_heading}
              </h1>
              {homepage.hero_subheading && (
                <p className="mt-3 max-w-sm text-sm text-ink-soft">{homepage.hero_subheading}</p>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-4">
                {font ? (
                  <ButtonLink href={`/fonts/${font.slug}`} variant="primary">
                    Shop {font.name}
                  </ButtonLink>
                ) : null}
                <ButtonLink href="/fonts" variant={font ? "ghost" : "primary"}>
                  Browse all fonts →
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!font) {
    return (
      <section className="border-b border-line bg-paper-dim">
        <div className="mx-auto max-w-grid px-6 py-10 md:px-10">
          <p className="eyebrow-accent mb-2">{homepage.hero_eyebrow}</p>
          <h1 className="font-display text-2xl font-semibold text-ink md:text-3xl">
            {homepage.hero_heading}
          </h1>
          <p className="mt-2 max-w-lg text-sm text-ink-soft">{homepage.hero_subheading}</p>
        </div>
      </section>
    );
  }

  const previewFile = font.files.find((f) => f.file_type === "preview");
  const woff2Url = previewFile ? publicStorageUrl(BUCKETS.previews, previewFile.storage_path) : null;

  // Background gallery shows the banner font plus other products.
  const sliderFonts = galleryFonts.some((f) => f.id === font.id)
    ? galleryFonts
    : [font, ...galleryFonts];

  const onSale = isSaleActive(font);
  const fromPrice =
    font.license_prices.length > 0
      ? Math.min(...font.license_prices.map((lp) => lp.price))
      : font.price;
  const discount = onSale ? getDiscountPercent(fromPrice, font.sale_price as number) : 0;

  return (
    <section className="border-b border-line bg-paper-dim">
      <div className="relative mx-auto h-[440px] max-w-grid overflow-hidden sm:h-[480px] md:h-[520px] lg:h-[580px]">
        {/* Background: auto-sliding, swipeable product gallery */}
        <HeroProductSlider fonts={sliderFonts} />

        {/* Gradient scrim — dark on the left for the caption, clearing to
            the right so the product photo reads through. A softer bottom
            fade keeps the progress bar / controls legible on any photo. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, #161616 0%, rgba(22,22,22,0.94) 32%, rgba(22,22,22,0.55) 56%, rgba(22,22,22,0.08) 78%, transparent 100%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 sm:hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(22,22,22,0.2) 0%, rgba(22,22,22,0.75) 65%, rgba(22,22,22,0.92) 100%)",
          }}
        />

        {/* Fixed caption — stays put on the left regardless of which
            product photo is showing behind it. */}
        <div className="relative z-10 flex h-full items-end px-6 pb-14 pt-10 sm:items-center sm:pb-10 md:px-10">
          <div className="max-w-md">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <p className="eyebrow-accent">{homepage.hero_eyebrow}</p>
              {onSale ? (
                <StampBadge variant="sale">{discount}% off right now</StampBadge>
              ) : font.is_new ? (
                <StampBadge variant="new">New release</StampBadge>
              ) : (
                <StampBadge variant="featured">Featured</StampBadge>
              )}
            </div>
            <LiveFontPreview
              fontFamily={`promo-${font.slug}`}
              woff2Url={woff2Url}
              text={font.name}
              eager
              as="h1"
              className="text-ink [font-size:clamp(1.9rem,4.2vw,3rem)] leading-[1.05] tracking-tight break-words"
            />
            {font.short_description && (
              <p className="mt-2 max-w-sm text-sm text-ink-soft">{font.short_description}</p>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <ButtonLink href={`/fonts/${font.slug}`} variant="primary">
                Shop {font.name}
              </ButtonLink>
              <ButtonLink href="/fonts" variant="ghost">
                Browse all fonts →
              </ButtonLink>
              <span className="text-sm font-semibold text-ink">
                {onSale
                  ? formatPrice(font.sale_price as number, font.currency)
                  : `from ${formatPrice(fromPrice, font.currency)}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
