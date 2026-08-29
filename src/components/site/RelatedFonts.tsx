import type { FontWithRelations } from "@/lib/types/database";
import { FontCard } from "@/components/site/FontCard";

export function RelatedFonts({ fonts }: { fonts: FontWithRelations[] }) {
  if (fonts.length === 0) return null;
  return (
    <section>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {fonts.map((font) => (
          <FontCard key={font.id} font={font} />
        ))}
      </div>
    </section>
  );
}
