import { FontFilterBar } from "@/components/site/FontFilterBar";
import { FontGrid } from "@/components/site/FontGrid";
import { getCategories, getPublishedFonts } from "@/lib/queries";

export const metadata = { title: "Fonts" };

export default async function FontsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const [fonts, categories] = await Promise.all([
    getPublishedFonts({ categorySlug: params.category, search: params.q }),
    getCategories(),
  ]);

  return (
    <div className="mx-auto max-w-grid px-6 py-10 md:px-10 md:py-14">
      <div className="mb-8 max-w-2xl">
        <p className="eyebrow-accent mb-2">Catalog</p>
        <h1 className="font-display text-3xl font-bold text-ink md:text-4xl">All fonts</h1>
      </div>

      <div className="mb-8">
        <FontFilterBar categories={categories} />
      </div>

      <p className="mb-5 text-sm text-ink-soft">
        {fonts.length} font{fonts.length === 1 ? "" : "s"}
      </p>

      <FontGrid fonts={fonts} />
    </div>
  );
}
