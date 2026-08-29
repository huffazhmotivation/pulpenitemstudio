import { PromoBanner } from "@/components/site/PromoBanner";
import { FontGrid } from "@/components/site/FontGrid";
import { CategoryGrid } from "@/components/site/CategoryGrid";
import { ButtonLink } from "@/components/ui/Button";
import {
  getCategoriesWithPreview,
  getFeaturedFonts,
  getHeroImages,
  getHomepageSettings,
  getLatestFonts,
  getOnSaleFonts,
  getPublishedFonts,
} from "@/lib/queries";

export default async function HomePage() {
  const homepage = await getHomepageSettings();
  const [newReleases, onSale, featured, categories, allFonts, heroImages] = await Promise.all([
    getLatestFonts(8),
    getOnSaleFonts(8),
    getFeaturedFonts(8),
    getCategoriesWithPreview(),
    getPublishedFonts(),
    getHeroImages(),
  ]);

  let bannerFont = null;
  if (homepage.hero_preview_font_id) {
    bannerFont = allFonts.find((f) => f.id === homepage.hero_preview_font_id) ?? null;
  }
  if (!bannerFont) bannerFont = onSale[0] ?? featured[0] ?? newReleases[0] ?? allFonts[0] ?? null;

  // Pool of products for the hero's auto-sliding gallery — sale + featured
  // + new releases, deduplicated, capped so the slider stays snappy.
  const seenIds = new Set<string>();
  const galleryFonts = [...onSale, ...featured, ...newReleases]
    .filter((f) => {
      if (seenIds.has(f.id)) return false;
      seenIds.add(f.id);
      return true;
    })
    .slice(0, 6);

  return (
    <>
      {/* 1. Compact promo / featured banner */}
      <PromoBanner homepage={homepage} font={bannerFont} galleryFonts={galleryFonts} heroImages={heroImages} />

      <div className="mx-auto max-w-grid px-6 md:px-10">
        {/* 2. New Releases */}
        {newReleases.length > 0 && (
          <section className="border-b border-line py-12 md:py-16">
            <div className="section-head mb-8">
              <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">New Releases</h2>
              <ButtonLink href="/fonts" variant="ghost" size="sm">View all →</ButtonLink>
            </div>
            <FontGrid fonts={newReleases.slice(0, 8)} />
          </section>
        )}

        {/* 3. On Sale */}
        {onSale.length > 0 && (
          <section className="border-b border-line py-12 md:py-16">
            <div className="section-head mb-8">
              <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">On Sale</h2>
              <ButtonLink href="/fonts" variant="ghost" size="sm">View all →</ButtonLink>
            </div>
            <FontGrid fonts={onSale.slice(0, 8)} />
          </section>
        )}

        {/* 4. Featured Fonts */}
        {featured.length > 0 && (
          <section className="border-b border-line py-12 md:py-16">
            <div className="section-head mb-8">
              <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">Featured Fonts</h2>
              <ButtonLink href="/fonts" variant="ghost" size="sm">View all →</ButtonLink>
            </div>
            <FontGrid fonts={featured.slice(0, 8)} />
          </section>
        )}

        {/* 5. Browse Categories */}
        {categories.length > 0 && (
          <section className="border-b border-line py-12 md:py-16">
            <div className="section-head mb-8">
              <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">Browse Categories</h2>
            </div>
            <CategoryGrid categories={categories} />
          </section>
        )}

        {/* 6. All Fonts */}
        <section className="border-b border-line py-12 md:py-16">
          <div className="section-head mb-8">
            <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">All Fonts</h2>
            <ButtonLink href="/fonts" variant="ghost" size="sm">Browse catalog →</ButtonLink>
          </div>
          <FontGrid fonts={allFonts.slice(0, 12)} />
        </section>

        {/* 7. Small About section */}
        <section className="py-12 md:py-16">
          <div className="grid gap-6 md:grid-cols-[1fr_1.4fr] md:items-center md:gap-16">
            <h2 className="font-display text-xl font-bold leading-snug text-ink md:text-2xl">
              {homepage.about_heading}
            </h2>
            <div className="space-y-4">
              <p className="text-sm text-ink-soft md:text-base">{homepage.about_body}</p>
              <ButtonLink href="/about" variant="secondary" size="sm">
                About the studio
              </ButtonLink>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
