import { HeroSlider } from "@/components/site/HeroSlider";
import type { FontWithRelations } from "@/lib/types/database";

/**
 * Thin adapter over HeroSlider for the auto-generated product photo
 * gallery: turns a list of fonts into generic slides.
 */
export function HeroProductSlider({ fonts }: { fonts: FontWithRelations[] }) {
  const slides = fonts
    .filter((f) => f.cover_image_url ?? f.images[0]?.image_url)
    .map((f) => ({
      id: f.id,
      imageUrl: (f.cover_image_url ?? f.images[0]?.image_url) as string,
      alt: f.name,
    }));

  return <HeroSlider slides={slides} />;
}
