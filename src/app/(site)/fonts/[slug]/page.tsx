import { notFound } from "next/navigation";
import { FontTester } from "@/components/site/FontTester";
import { GlyphPreview } from "@/components/site/GlyphPreview";
import { OrderButtons } from "@/components/site/OrderButtons";
import { RelatedFonts } from "@/components/site/RelatedFonts";
import { LiveFontPreview } from "@/components/site/LiveFontPreview";
import { ProductGallery } from "@/components/site/ProductGallery";
import { Badge, StampBadge } from "@/components/ui/Badge";
import { getFontBySlug, getRelatedFonts, getSiteSettings } from "@/lib/queries";
import { publicStorageUrl, BUCKETS } from "@/lib/storage";
import { formatPrice, isSaleActive, getDiscountPercent } from "@/lib/utils";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const font = await getFontBySlug(slug);
  if (!font) return {};
  return {
    title: font.seo_title || font.name,
    description: font.meta_description || font.short_description || undefined,
  };
}

export default async function FontDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const font = await getFontBySlug(slug);
  if (!font) notFound();

  const [related, settings] = await Promise.all([
    getRelatedFonts(font),
    getSiteSettings(),
  ]);

  const regularPreview = font.files.find((f) => f.file_type === "preview");
  const woff2Url = regularPreview ? publicStorageUrl(BUCKETS.previews, regularPreview.storage_path) : null;
  const gallery = [...font.images].sort((a, b) => a.sort_order - b.sort_order).slice(0, 10);
  const fileFormats = Array.from(
    new Set(font.files.filter((f) => f.file_type === "preview").map((f) => f.format.toUpperCase()))
  );
  const masterFormatsNote = "OTF · TTF (delivered after order)";

  const onSale = isSaleActive(font);
  const fromPrice =
    font.license_prices.length > 0
      ? Math.min(...font.license_prices.map((lp) => lp.price))
      : font.price;
  const discount = onSale ? getDiscountPercent(fromPrice, font.sale_price as number) : 0;

  return (
    <div className="mx-auto max-w-grid px-6 py-10 md:px-10 md:py-14">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_360px]">
        <div className="space-y-14">
          {/* 1. Product name + price/license/order buttons */}
          <section>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge>{font.category?.name ?? "Uncategorised"}</Badge>
              {font.is_new && <StampBadge variant="new">New</StampBadge>}
              {onSale && <StampBadge variant="sale">{discount}% off</StampBadge>}
              {font.is_featured && !onSale && <StampBadge variant="featured">Featured</StampBadge>}
            </div>
            <LiveFontPreview
              fontFamily={`preview-${font.slug}`}
              woff2Url={woff2Url}
              text={font.name}
              eager
              as="h1"
              className="text-ink [font-size:clamp(2.25rem,6vw,4.25rem)] leading-[1.02] tracking-tight break-words"
            />
            {font.short_description && (
              <p className="mt-4 max-w-2xl text-base text-ink-soft md:text-lg">{font.short_description}</p>
            )}

            <div className="mt-6 flex flex-wrap items-baseline gap-3">
              {onSale ? (
                <>
                  <span className="text-2xl font-semibold text-sale">
                    {formatPrice(font.sale_price as number, font.currency)}
                  </span>
                  <span className="text-base text-ink-faint line-through">
                    {formatPrice(fromPrice, font.currency)}
                  </span>
                </>
              ) : (
                <span className="text-2xl font-semibold text-ink">
                  from {formatPrice(fromPrice, font.currency)}
                </span>
              )}
            </div>

            {/* Order buttons live in the sidebar on desktop; shown here first on mobile */}
            <div className="mt-6 lg:hidden">
              <OrderButtons
                fontName={font.name}
                fontSlug={font.slug}
                currency={font.currency}
                licensePrices={font.license_prices}
                whatsappNumber={settings.whatsapp_number}
                contactEmail={settings.contact_email}
              />
            </div>
          </section>

          {/* 2. Large product image gallery — main visual focus before the tester */}
          {gallery.length > 0 && (
            <section>
              <ProductGallery images={gallery} fontName={font.name} />
            </section>
          )}

          {/* 3. Description + font information */}
          <section className="space-y-8">
            {font.full_description && (
              <div>
                <p className="eyebrow mb-3">About this typeface</p>
                <p className="max-w-3xl whitespace-pre-line text-base leading-relaxed text-ink-soft">
                  {font.full_description}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-6 rounded-lg border border-line p-6 sm:grid-cols-4">
              <div>
                <p className="eyebrow">Designer</p>
                <p className="mt-1 text-sm text-ink">{font.designer ?? "—"}</p>
              </div>
              <div>
                <p className="eyebrow">Released</p>
                <p className="mt-1 text-sm text-ink">{font.release_year ?? "—"}</p>
              </div>
              <div>
                <p className="eyebrow">Version</p>
                <p className="mt-1 text-sm text-ink">{font.version ?? "—"}</p>
              </div>
              <div>
                <p className="eyebrow">Styles</p>
                <p className="mt-1 text-sm text-ink">{font.styles.length}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              <div>
                <p className="eyebrow mb-3">OpenType features</p>
                {font.font_features.length > 0 ? (
                  <ul className="space-y-1.5 text-sm text-ink-soft">
                    {font.font_features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink-soft">—</p>
                )}
              </div>
              <div>
                <p className="eyebrow mb-3">Language support</p>
                {font.language_support.length > 0 ? (
                  <ul className="space-y-1.5 text-sm text-ink-soft">
                    {font.language_support.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink-soft">—</p>
                )}
              </div>
              <div>
                <p className="eyebrow mb-3">File formats</p>
                <ul className="space-y-1.5 text-sm text-ink-soft">
                  <li>Preview: {fileFormats.join(", ") || "—"}</li>
                  <li>Delivered: {masterFormatsNote}</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 4. Interactive Font Tester */}
          <section>
            <p className="eyebrow mb-4">Test drive — editable specimen</p>
            <FontTester
              fontSlug={font.slug}
              styles={font.styles}
              files={font.files}
              defaultText={font.default_preview_text ?? font.name}
              fallbackWoff2Url={woff2Url}
            />
          </section>

          {/* 5. Font family / style previews */}
          <section>
            <p className="eyebrow mb-4">Family styles</p>
            <div className="divide-y divide-line rounded-lg border border-line">
              {[...font.styles]
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((s) => {
                  const styleFile = font.files.find(
                    (f) => f.file_type === "preview" && f.style_id === s.id
                  );
                  const styleWoff2 = styleFile
                    ? publicStorageUrl(BUCKETS.previews, styleFile.storage_path)
                    : woff2Url;
                  return (
                    <div key={s.id} className="flex items-center justify-between gap-4 px-6 py-4">
                      <LiveFontPreview
                        fontFamily={`familystyle-${font.slug}-${s.id}`}
                        woff2Url={styleWoff2}
                        text={font.name}
                        fontSize={30}
                        weight={s.weight}
                        italic={s.is_italic}
                        className="text-ink"
                      />
                      <span className="shrink-0 text-xs text-ink-soft">
                        {s.name}
                      </span>
                    </div>
                  );
                })}
            </div>
          </section>

          {/* 6. Glyphs and multilingual characters */}
          <section>
            <p className="eyebrow mb-4">Alphabet &amp; glyphs</p>
            <GlyphPreview
              fontFamily={`preview-${font.slug}`}
              woff2Url={woff2Url}
              languageSupport={font.language_support}
            />
          </section>
        </div>

        {/* Sidebar: purchase (desktop) */}
        <aside className="hidden space-y-6 lg:sticky lg:top-24 lg:block lg:self-start">
          <div>
            <p className="eyebrow mb-3">License &amp; order</p>
            <OrderButtons
              fontName={font.name}
              fontSlug={font.slug}
              currency={font.currency}
              licensePrices={font.license_prices}
              whatsappNumber={settings.whatsapp_number}
              contactEmail={settings.contact_email}
            />
            <p className="mt-3 text-xs text-ink-soft">
              See <a href="/license" className="underline hover:text-ink">license terms</a> for full usage rights.
            </p>
          </div>

          <div>
            <p className="eyebrow mb-3">Family</p>
            <ul className="divide-y divide-line rounded-lg border border-line text-sm">
              {[...font.styles]
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((s) => (
                  <li key={s.id} className="flex items-center px-4 py-2.5">
                    <span
                      style={{ fontWeight: s.weight, fontStyle: s.is_italic ? "italic" : "normal" }}
                      className="text-ink"
                    >
                      {s.name}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* 7. Related Fonts */}
      {related.length > 0 && (
        <div className="mt-20 border-t border-line pt-12">
          <p className="eyebrow mb-4">Related fonts</p>
          <RelatedFonts fonts={related} />
        </div>
      )}
    </div>
  );
}
