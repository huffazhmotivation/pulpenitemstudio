import { FontFilterBar } from "@/components/site/FontFilterBar";
import { FontGrid } from "@/components/site/FontGrid";
import { getCategories, getPublishedFonts } from "@/lib/queries";
import { isSaleActive } from "@/lib/utils";

export const metadata = { title: "Fonts" };

export default async function FontsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sale?: string }>;
}) {
  const params = await searchParams;
  const [all, categories] = await Promise.all([
    getPublishedFonts({ categorySlug: params.category, search: params.q }),
    getCategories(),
  ]);
  const fonts = params.sale ? all.filter(isSaleActive) : all;

  return (
    <div className="mx-auto max-w-grid px-4 pb-4 sm:px-6 md:px-10">
      <div className="mb-8 mt-2">
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-[-0.035em] text-ink">
          {params.sale ? "On sale" : "All fonts"}
        </h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          {fonts.length} font{fonts.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="mb-8">
        <FontFilterBar categories={categories} />
      </div>

      <FontGrid fonts={fonts} />
    </div>
  );
}
