"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { FontSlide, SLIDE_KINDS, SLIDE_LABELS, type SlideKind } from "@/components/site/FontMockup";
import { useFontFace } from "@/lib/useFontFace";
import { cn } from "@/lib/utils";

type Slide = { type: "img"; src: string; alt: string } | { type: "mock"; kind: SlideKind };

interface FontGalleryProps {
  fontName: string;
  category: string;
  tint: string;
  woff2Url: string | null;
  /** Images the admin uploaded, in order. They come first. */
  images: { src: string; alt: string }[];
}

/** Uploaded images first, then compositions drawn from the font itself. */
export function FontGallery({ fontName, category, tint, woff2Url, images }: FontGalleryProps) {
  const { family } = useFontFace("gallery", woff2Url, true);
  const slides: Slide[] = [
    ...images.map((i) => ({ type: "img", ...i }) as Slide),
    ...SLIDE_KINDS.map((kind) => ({ type: "mock", kind }) as Slide),
  ];
  const [active, setActive] = useState(0);
  const go = (n: number) => setActive(((n % slides.length) + slides.length) % slides.length);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = document.activeElement as HTMLElement | null;
      if (el && (/INPUT|TEXTAREA|SELECT/.test(el.tagName) || el.isContentEditable)) return;
      if (e.key === "ArrowRight") setActive((a) => (a + 1) % slides.length);
      if (e.key === "ArrowLeft") setActive((a) => (a - 1 + slides.length) % slides.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slides.length]);

  const render = (s: Slide, priority = false) =>
    s.type === "img" ? (
      <div className="relative aspect-[4/3] w-full">
        <Image src={s.src} alt={s.alt} fill priority={priority} className="object-cover" sizes="(max-width: 1024px) 100vw, 800px" />
      </div>
    ) : (
      <FontSlide kind={s.kind} family={family} name={fontName} category={category} tint={tint} />
    );

  const label = (s: Slide) => (s.type === "img" ? "Photo" : SLIDE_LABELS[s.kind]);

  return (
    <section aria-label="Font previews" className="grid gap-3">
      <div className="relative overflow-hidden rounded-2xl bg-panel shadow-card">
        <div key={active} className="animate-fade-up">{render(slides[active], active === 0)}</div>
        <button
          type="button"
          onClick={() => go(active - 1)}
          aria-label="Previous preview"
          className="absolute left-3.5 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-xl shadow-lift hover:bg-ink hover:text-white"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => go(active + 1)}
          aria-label="Next preview"
          className="absolute right-3.5 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-xl shadow-lift hover:bg-ink hover:text-white"
        >
          ›
        </button>
        <span className="absolute bottom-3.5 right-4 z-10 rounded-full bg-ink/70 px-3 py-1 text-xs font-bold text-white">
          {active + 1} / {slides.length} · {label(slides[active])}
        </span>
      </div>

      <div className="scrollbar-thin flex gap-2.5 overflow-x-auto pb-1">
        {slides.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => go(i)}
            aria-label={`${label(s)} preview`}
            aria-current={i === active}
            className={cn(
              "w-[calc((100%-50px)/6)] min-w-[88px] shrink-0 overflow-hidden rounded-lg bg-panel shadow-card transition-opacity",
              i === active ? "opacity-100 outline outline-[3px] outline-offset-2 outline-ink" : "opacity-70 hover:opacity-100"
            )}
          >
            <span className="pointer-events-none block">{render(s)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
