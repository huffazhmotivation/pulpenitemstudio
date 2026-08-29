"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { FontImage } from "@/lib/types/database";

const TRANSITION_MS = 520;

/**
 * Product gallery for a font's specimen images. Instead of a flat
 * scrolling filmstrip, switching slides "pushes" the incoming image
 * in from the direction of travel while it scales up from 94% and
 * fades in, with a quick signal-colored light sweep across it on
 * arrival — gives the transition some personality instead of a
 * generic carousel slide.
 */
export function ProductGallery({ images, fontName }: { images: FontImage[]; fontName: string }) {
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  const count = sorted.length;
  const [active, setActive] = useState(0);
  const [transition, setTransition] = useState<{ from: number; dir: 1 | -1 } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (count === 0) return null;

  function goTo(i: number) {
    const target = ((i % count) + count) % count;
    if (target === active) return;

    // Shortest-path direction so wrap-around (last -> first via "next")
    // still animates forward instead of visually reversing.
    const forwardDist = (target - active + count) % count;
    const backwardDist = (active - target + count) % count;
    const dir: 1 | -1 = forwardDist <= backwardDist ? 1 : -1;

    if (timerRef.current) clearTimeout(timerRef.current);
    setTransition({ from: active, dir });
    setActive(target);
    timerRef.current = setTimeout(() => setTransition(null), TRANSITION_MS);
  }

  const outgoing = transition ? sorted[transition.from] : null;
  const current = sorted[active];

  return (
    <div>
      {/* Main image with counter */}
      <div className="group scan-sweep relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-line bg-paper-dim">
        {outgoing && (
          <div
            key={`out-${transition!.from}`}
            className="absolute inset-0"
            style={{
              animation: `${transition!.dir === 1 ? "gallerySlideOutLeft" : "gallerySlideOutRight"} ${TRANSITION_MS}ms cubic-bezier(0.6,0,0.3,1) forwards`,
            }}
          >
            <Image
              src={outgoing.image_url}
              alt={outgoing.alt_text ?? fontName}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 900px"
            />
          </div>
        )}

        <div
          key={`in-${active}`}
          className="absolute inset-0"
          style={
            transition
              ? {
                  animation: `${transition.dir === 1 ? "gallerySlideInRight" : "gallerySlideInLeft"} ${TRANSITION_MS}ms cubic-bezier(0.16,1,0.3,1) forwards`,
                }
              : undefined
          }
        >
          <Image
            src={current.image_url}
            alt={current.alt_text ?? fontName}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 900px"
          />
        </div>

        {count > 1 && (
          <div className="absolute bottom-3 right-3 z-20 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold text-white">
            {active + 1} / {count}
          </div>
        )}

        {count > 1 && (
          <>
            <div className="absolute inset-y-0 left-3 z-20 flex items-center">
              <button
                type="button"
                onClick={() => goTo(active - 1)}
                aria-label="Previous image"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-panel/90 text-ink shadow-sm transition-colors hover:bg-panel"
              >
                ‹
              </button>
            </div>
            <div className="absolute inset-y-0 right-3 z-20 flex items-center">
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
