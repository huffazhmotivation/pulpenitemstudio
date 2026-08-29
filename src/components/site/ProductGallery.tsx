"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { FontImage } from "@/lib/types/database";

export function ProductGallery({ images, fontName }: { images: FontImage[]; fontName: string }) {
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  const [active, setActive] = useState(0);

  if (sorted.length === 0) return null;

  const current = sorted[Math.min(active, sorted.length - 1)];

  return (
    <div>
      {/* Main image with counter */}
      <div className="group scan-sweep relative aspect-[16/10] w-full rounded-lg border border-line bg-paper-dim">
        <Image
          key={current.id}
          src={current.image_url}
          alt={current.alt_text ?? fontName}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 900px"
        />
        {sorted.length > 1 && (
          <div className="absolute bottom-3 right-3 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold text-white">
            {active + 1} / {sorted.length}
          </div>
        )}

        {sorted.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setActive((i) => (i - 1 + sorted.length) % sorted.length)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-panel/90 text-ink shadow-sm transition-colors hover:bg-panel"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setActive((i) => (i + 1) % sorted.length)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-panel/90 text-ink shadow-sm transition-colors hover:bg-panel"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Thumbnail rail */}
      {sorted.length > 1 && (
        <div className="scrollbar-thin mt-3 flex gap-2.5 overflow-x-auto pb-1">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                i === active ? "border-signal" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <Image
                src={img.image_url}
                alt={img.alt_text ?? `${fontName} preview ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
