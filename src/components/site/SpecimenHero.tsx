import Link from "next/link";
import { LiveFontPreview } from "@/components/site/LiveFontPreview";
import { RegMark } from "@/components/site/CropMarks";
import { ColorBar } from "@/components/site/ColorBar";
import { ButtonLink } from "@/components/ui/Button";
import { StampBadge } from "@/components/ui/Badge";
import type { FontWithRelations, HomepageSettings } from "@/lib/types/database";
import { publicStorageUrl, BUCKETS } from "@/lib/storage";

export function SpecimenHero({
  homepage,
  heroFont,
}: {
  homepage: HomepageSettings;
  heroFont: FontWithRelations | null;
}) {
  const previewFile = heroFont?.files.find((f) => f.file_type === "preview");
  const woff2Url = previewFile ? publicStorageUrl(BUCKETS.previews, previewFile.storage_path) : null;
  const styleNames = heroFont
    ? [...heroFont.styles].sort((a, b) => a.sort_order - b.sort_order).map((s) => s.name)
    : [];

  return (
    <section className="relative border-b border-line">
      <RegMark className="absolute left-4 top-4 md:left-8 md:top-8" />
      <RegMark className="absolute right-4 top-4 md:right-8 md:top-8" />

      <div className="mx-auto max-w-grid px-6 pb-14 pt-20 md:px-10 md:pb-16 md:pt-28">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <p className="eyebrow-accent">{homepage.hero_eyebrow}</p>
          {heroFont?.is_new && <StampBadge>New typeface</StampBadge>}
        </div>

        <LiveFontPreview
          fontFamily={heroFont ? `preview-${heroFont.slug}` : "hero-fallback"}
          woff2Url={woff2Url}
          text={homepage.hero_preview_text || "Pulpenitem"}
          fontSize={120}
          eager
          as="h1"
          className="max-w-full text-ink [font-size:clamp(3.25rem,11vw,9.5rem)] leading-[0.92] tracking-tight break-words"
        />

        <div className="mt-10 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <p className="max-w-xl text-lg text-ink-soft md:text-xl">
            {homepage.hero_subheading}
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/fonts" variant="primary" size="lg">
              Browse fonts
            </ButtonLink>
            {heroFont && (
              <ButtonLink href={`/fonts/${heroFont.slug}`} variant="ghost" size="lg">
                View {heroFont.name} →
              </ButtonLink>
            )}
          </div>
        </div>
      </div>

      <ColorBar />

      {/* Specimen strip — running order of the hero font's styles, like a type spec sheet */}
      {heroFont && styleNames.length > 0 && (
        <div className="mx-auto flex max-w-grid items-center gap-6 overflow-x-auto px-6 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft md:px-10">
          <span className="shrink-0 text-signal">{heroFont.name}</span>
          {styleNames.map((name) => (
            <span key={name} className="shrink-0">
              {name}
            </span>
          ))}
          <Link href={`/fonts/${heroFont.slug}`} className="shrink-0 hover:text-signal">
            Full specimen →
          </Link>
        </div>
      )}
    </section>
  );
}
