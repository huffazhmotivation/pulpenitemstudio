"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { FontImage } from "@/lib/types/database";

export function ProductGallery({ images, fontName }: { images: FontImage[]; fontName: string }) {
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  const [active, setActive] = useState(0);
  const count = sorted.length;

  if (count === 0) return null;

  const goTo = (i: number) => setActive(((i % count) + count) % count);

  return (
    <div>
      {/* Main image with counter */}
      <div className="group scan-sweep relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-line bg-paper-dim">
        <div
          className="flex h-full"
          style={{
            width: `${count * 100}%`,
            transform: `translateX(${-active * (100 / count)}%)`,
            transition: "transform 550ms cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {sorted.map((img, i) => (
            <div key={img.id} className="relative h-full shrink-0" style={{ width: `${100 / count}%` }}>
              <Image
                src={img.image_url}
                alt={img.alt_text ?? fontName}
                fill
                priority={i === 0}
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 900px"
              />
            </div>
          ))}
        </div>

        {count > 1 && (
          <div className="absolute bottom-3 right-3 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold text-white">
            {active + 1} / {count}
          </div>
        )}

        {count > 1 && (
          <>
            <div className="absolute inset-y-0 left-3 flex items-center">
              <button
                type="button"
                onClick={() => goTo(active - 1)}
                aria-label="Previous image"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-panel/90 text-ink shadow-sm transition-colors hover:bg-panel"
              >
                ‹
              </button>
            </div>
            <div className="absolute inset-y-0 right-3 flex items-center">
              <button
                type="button"
                onClick={() => goTo(active + 1)}
                aria-label="Next image"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-panel/90 text-ink shadow-sm transition-colors hover:bg-panel"
              >
                ›
              </button>
            </div>
          </>
        )}
      </div>

      {/* Thumbnail rail */}
      {count > 1 && (
        <div className="scrollbar-thin mt-3 flex gap-2.5 overflow-x-auto pb-1">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => goTo(i)}
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
