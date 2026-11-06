import Link from "next/link";
import { notFound } from "next/navigation";
import { FontGallery } from "@/components/site/FontGallery";
import { FontGrid } from "@/components/site/FontGrid";
import { FontTester } from "@/components/site/FontTester";
import { GlyphPreview } from "@/components/site/GlyphPreview";
import { LiveFontPreview } from "@/components/site/LiveFontPreview";
import { tintFor } from "@/components/site/FontMockup";
import { OrderRail } from "@/components/site/OrderRail";
import { getFontBySlug, getRelatedFonts, getSiteSettings } from "@/lib/queries";
import { publicStorageUrl, BUCKETS } from "@/lib/storage";
import { getDiscountPercent, isSaleActive } from "@/lib/utils";
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 text-2xl font-extrabold tracking-[-0.03em] text-ink">{title}</h2>
      {children}
    </section>
  );
}

export default async function FontDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const font = await getFontBySlug(slug);
  if (!font) notFound();

  const [related, settings] = await Promise.all([getRelatedFonts(font), getSiteSettings()]);

  const regularPreview = font.files.find((f) => f.file_type === "preview");
  const woff2Url = regularPreview ? publicStorageUrl(BUCKETS.previews, regularPreview.storage_path) : null;

  // The cover first, then the gallery, without repeating the cover.
  const gallery = [...font.images].sort((a, b) => a.sort_order - b.sort_order).slice(0, 10);
  const images = [
    ...(font.cover_image_url && !gallery.some((g) => g.image_url === font.cover_image_url)
      ? [{ src: font.cover_image_url, alt: `${font.name} cover` }]
      : []),
    ...gallery.map((g) => ({ src: g.image_url, alt: g.alt_text ?? font.name })),
  ];

  const fileFormats = Array.from(
    new Set(font.files.filter((f) => f.file_type === "preview").map((f) => f.format.toUpperCase()))
  );

  const onSale = isSaleActive(font);
  const fromPrice =
    font.license_prices.length > 0 ? Math.min(...font.license_prices.map((lp) => lp.price)) : font.price;
  const discount = onSale ? getDiscountPercent(fromPrice, font.sale_price as number) : 0;
  const category = font.category?.name ?? "Uncategorised";
  const sortedStyles = [...font.styles].sort((a, b) => a.sort_order - b.sort_order);

  const facts: [string, string][] = [
    ["Designer", font.designer ?? "—"],
    ["Released", font.release_year ? String(font.release_year) : "—"],
    ["Version", font.version ?? "—"],
    ["Styles", String(font.styles.length)],
    ["Delivered", "OTF · TTF after order"],
    ["Preview files", fileFormats.join(", ") || "—"],
  ];

  return (
    <div className="mx-auto max-w-grid px-4 pb-4 sm:px-6 md:px-10">
      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-[13px] font-medium text-ink-soft">
        <Link href="/fonts" className="hover:text-ink">Fonts</Link>
        <span className="text-ink-faint">/</span>
        <span>{category}</span>
        <span className="text-ink-faint">/</span>
        <span className="text-ink">{font.name}</span>
      </nav>

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid min-w-0 gap-14">
          <FontGallery
            fontName={font.name}
            category={category}
            tint={tintFor(font.slug)}
            woff2Url={woff2Url}
            images={images}
          />

          <Section title="About this typeface">
            <LiveFontPreview
              fontFamily={`preview-${font.slug}`}
              woff2Url={woff2Url}
              text={font.name}
              eager
              as="p"
              className="mb-4 text-ink [font-size:clamp(2rem,4.5vw,3.25rem)] leading-[1.05] break-words"
            />
            {font.short_description && <p className="max-w-2xl text-base text-ink-soft md:text-lg">{font.short_description}</p>}
            {font.full_description && (
              <p className="mt-3 max-w-3xl whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">{font.full_description}</p>
            )}
            <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {facts.map(([k, v]) => (
                <div key={k} className="rounded-xl bg-panel px-4 py-3.5 shadow-card">
                  <dt className="eyebrow">{k}</dt>
                  <dd className="mt-1 text-sm font-bold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            {(font.font_features.length > 0 || font.language_support.length > 0) && (
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {font.font_features.length > 0 && (
                  <div>
                    <p className="eyebrow mb-2.5">OpenType features</p>
                    <div className="flex flex-wrap gap-1.5">
                      {font.font_features.map((f) => (
                        <span key={f} className="rounded-full bg-panel px-3 py-1 text-xs font-semibold text-ink ring-1 ring-inset ring-line">{f}</span>
                      ))}
                    </div>
                  </div>
                )}
                {font.language_support.length > 0 && (
                  <div>
                    <p className="eyebrow mb-2.5">Language support</p>
                    <div className="flex flex-wrap gap-1.5">
                      {font.language_support.map((l) => (
                        <span key={l} className="rounded-full bg-panel px-3 py-1 text-xs font-semibold text-ink ring-1 ring-inset ring-line">{l}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Section>

          <Section title="Try it">
            <FontTester
              fontSlug={font.slug}
              styles={font.styles}
              files={font.files}
              defaultText={font.default_preview_text ?? font.name}
              fallbackWoff2Url={woff2Url}
            />
          </Section>

          <Section title="Styles">
            <div className="divide-y divide-line overflow-hidden rounded-2xl bg-panel shadow-card">
              {sortedStyles.map((s) => {
                const styleFile = font.files.find((f) => f.file_type === "preview" && f.style_id === s.id);
                const styleWoff2 = styleFile ? publicStorageUrl(BUCKETS.previews, styleFile.storage_path) : woff2Url;
                return (
                  <div key={s.id} className="flex items-center justify-between gap-4 px-6 py-4">
                    <LiveFontPreview
                      fontFamily={`familystyle-${font.slug}-${s.id}`}
                      woff2Url={styleWoff2}
                      text={font.name}
                      fontSize={32}
                      weight={s.weight}
                      italic={s.is_italic}
                      className="min-w-0 truncate text-ink"
                    />
                    <span className="shrink-0 text-xs font-semibold text-ink-soft">{s.name}</span>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="Alphabet & glyphs">
            <GlyphPreview
              fontFamily={`preview-${font.slug}`}
              woff2Url={woff2Url}
              languageSupport={font.language_support}
            />
          </Section>
        </div>

        <OrderRail
          fontName={font.name}
          fontSlug={font.slug}
          category={category}
          styleCount={font.styles.length}
          isNew={font.is_new}
          discount={discount}
          currency={font.currency}
          licensePrices={font.license_prices}
          whatsappNumber={settings.whatsapp_number}
          contactEmail={settings.contact_email}
        />
      </div>

      {related.length > 0 && (
        <section className="pt-20">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold tracking-[-0.03em] text-ink">More typefaces</h2>
            <Link href="/fonts" className="text-sm font-semibold text-ink underline underline-offset-4">View all</Link>
          </div>
          <FontGrid fonts={related} />
        </section>
      )}
    </div>
  );
}
