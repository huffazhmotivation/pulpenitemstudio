import type { FontWithRelations } from "@/lib/types/database";
import { FontCard } from "@/components/site/FontCard";

export function FontGrid({ fonts, text }: { fonts: FontWithRelations[]; text?: string }) {
  if (fonts.length === 0) {
    return (
      <div className="rounded-xl bg-panel py-20 text-center shadow-card">
        <p className="text-xl font-bold text-ink">No fonts found</p>
        <p className="mt-2 text-sm text-ink-soft">Try a different search term or category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {fonts.map((font) => (
        <FontCard key={font.id} font={font} text={text} />
      ))}
    </div>
  );
}
