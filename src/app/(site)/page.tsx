import Link from "next/link";
import { Catalog } from "@/components/site/Catalog";
import { GlyphLab } from "@/components/site/GlyphLab";
import { Hero, type HeroFont } from "@/components/site/Hero";
import { SaleCard } from "@/components/site/SaleCard";
import { StyleBento, type StyleTile } from "@/components/site/StyleBento";
import {
  getCategories,
  getFeaturedFonts,
  getHomepageSettings,
  getLatestFonts,
  getLicenses,
  getOnSaleFonts,
  getPublishedFonts,
  getSiteSettings,
} from "@/lib/queries";
import { BUCKETS, publicStorageUrl } from "@/lib/storage";
import { formatPrice, getEffectivePrice } from "@/lib/utils";
import type { FontWithRelations } from "@/lib/types/database";

const previewUrl = (f: FontWithRelations) => {
  const regular = f.styles.find((s) => s.weight === 400 && !s.is_italic) ?? f.styles[0];
  const file =
    f.files.find((x) => x.file_type === "preview" && (regular ? x.style_id === regular.id : true)) ??
    f.files.find((x) => x.file_type === "preview");
  return file ? publicStorageUrl(BUCKETS.previews, file.storage_path) : null;
};

const LICENSE_TONES = ["bg-[#E9EBEF]", "bg-[#FFF1BF]", "bg-[#DDF5EC]", "bg-[#ECE6FF]"];

export default async function HomePage() {
  const [homepage, site, allFonts, featured, latest, onSale, categories, licenses] = await Promise.all([
    getHomepageSettings(),
    getSiteSettings(),
    getPublishedFonts(),
    getFeaturedFonts(8),
    getLatestFonts(8),
    getOnSaleFonts(4),
    getCategories(),
    getLicenses(),
  ]);

  // Fonts that rotate in the hero: featured, new and on sale first, then the rest.
  const seen = new Set<string>();
  const heroFonts: HeroFont[] = [...featured, ...onSale, ...latest, ...allFonts]
    .filter((f) => {
      if (seen.has(f.id) || !previewUrl(f)) return false;
      seen.add(f.id);
      return true;
    })
    .slice(0, 8)
    .map((f) => ({
      id: f.id,
      name: f.name,
      slug: f.slug,
      category: f.category?.name ?? "",
      priceLabel: `from ${formatPrice(
        f.license_prices.length ? Math.min(...f.license_prices.map((lp) => lp.price)) : getEffectivePrice(f),
        f.currency
      )}`,
      woff2Url: previewUrl(f),
    }));

  const tiles: StyleTile[] = categories
    .map((c) => {
      const inCat = allFonts.filter((f) => f.category_id === c.id);
      const sample = inCat.find((f) => previewUrl(f)) ?? inCat[0];
      return {
        slug: c.slug,
        name: c.name,
        count: inCat.length,
        fontName: sample?.name ?? null,
        woff2Url: sample ? previewUrl(sample) : null,
      };
    })
    .filter((t) => t.count > 0);

  return (
    <div className="mx-auto max-w-grid px-4 pb-4 sm:px-6 md:px-10">
      <Hero
        fonts={heroFonts}
        eyebrow={homepage.hero_eyebrow || "Independent type foundry"}
        heading={homepage.hero_heading || "Fonts that give your brand a voice."}
        subheading={homepage.hero_subheading || site.studio_tagline || "Typefaces drawn in-house for posters, packaging and screens."}
        fallbackName={homepage.hero_preview_text || site.studio_name}
      />

      {tiles.length > 0 && (
        <section className="pt-16 md:pt-24">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-[clamp(1.75rem,3.2vw,2.5rem)] font-extrabold tracking-[-0.03em] text-ink">Browse by style</h2>
            <span className="hidden text-sm text-ink-soft sm:block">Tap a style to filter the catalog</span>
          </div>
          <StyleBento tiles={tiles} />
        </section>
      )}

      <section className="mt-16 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <GlyphLab />
        <SaleCard fonts={onSale} />
      </section>

      <section id="katalog" className="scroll-mt-6 pt-16 md:pt-24">
        <div className="mb-6">
          <h2 className="text-[clamp(1.75rem,3.2vw,2.5rem)] font-extrabold tracking-[-0.03em] text-ink">
            {homepage.latest_heading || "All fonts"}
          </h2>
          <p className="mt-1.5 text-sm text-ink-soft">
            {allFonts.length} typeface{allFonts.length === 1 ? "" : "s"}
          </p>
        </div>
        <Catalog fonts={allFonts} />
      </section>

      {licenses.length > 0 && (
        <section className="pt-16 md:pt-24">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-[clamp(1.75rem,3.2vw,2.5rem)] font-extrabold tracking-[-0.03em] text-ink">One license for every use</h2>
            <Link href="/license" className="text-sm font-semibold text-ink underline underline-offset-4">License terms</Link>
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {licenses.slice(0, 4).map((l, i) => (
              <div key={l.id} className={`flex min-h-[200px] flex-col justify-between gap-8 rounded-[30px] p-6 transition-transform duration-200 hover:-translate-y-1 ${LICENSE_TONES[i % LICENSE_TONES.length]}`}>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 text-sm font-extrabold text-ink">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="text-lg font-bold tracking-tight text-ink">{l.name}</p>
                  {l.description && <p className="mt-1.5 line-clamp-3 text-sm text-ink/70">{l.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {(homepage.about_heading || homepage.about_body) && (
        <section className="grid gap-6 pt-16 md:grid-cols-[1fr_1.3fr] md:items-center md:gap-16 md:pt-24">
          <h2 className="text-balance text-[clamp(1.5rem,2.6vw,2.1rem)] font-extrabold leading-tight tracking-[-0.03em] text-ink">{homepage.about_heading}</h2>
          <div>
            <p className="text-[15px] text-ink-soft md:text-base">{homepage.about_body}</p>
            <Link href="/about" className="mt-4 inline-block text-sm font-semibold text-ink underline underline-offset-4">About the studio</Link>
          </div>
        </section>
      )}
    </div>
  );
}
