import type { FontWithRelations } from "@/lib/types/database";
import { FontCard } from "@/components/site/FontCard";

export function FontGrid({ fonts }: { fonts: FontWithRelations[] }) {
  if (fonts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line py-24 text-center">
        <p className="font-display text-xl font-semibold text-ink">No fonts found</p>
        <p className="mt-2 text-sm text-ink-soft">Try a different search term or category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
      {fonts.map((font) => (
        <FontCard key={font.id} font={font} />
      ))}
    </div>
  );
}
