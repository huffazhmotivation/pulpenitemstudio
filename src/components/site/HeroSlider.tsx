"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const AUTOPLAY_MS = 4800;
const RESUME_AFTER_INTERACTION_MS = 6000;

export interface HeroSlide {
  id: string;
  imageUrl: string;
  alt: string;
}

/**
 * Full-bleed background image carousel — fills its positioned parent
 * (the parent controls width/height/aspect). Designed to sit *behind*
 * static overlay text + a gradient scrim, so it only renders the
 * photos + controls, no per-slide captions. Generic over any list of
 * {id, imageUrl, alt} slides — used both for the admin-managed hero
 * gallery and the auto-generated product photo slider.
 */
export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const count = slides.length;

  const [index, setIndex] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dragState = useRef<{ startX: number; deltaX: number; dragging: boolean }>({
    startX: 0,
    deltaX: 0,
    dragging: false,
  });
  const [dragOffset, setDragOffset] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (i: number) => {
      if (count === 0) return;
      setIndex(((i % count) + count) % count);
      setCycle((c) => c + 1);
    },
    [count]
  );
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  const pauseThenResume = useCallback(() => {
    setIsPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setIsPaused(false), RESUME_AFTER_INTERACTION_MS);
  }, []);

  useEffect(() => () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  }, []);

  useEffect(() => {
    if (count <= 1 || isPaused) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % count);
      setCycle((c) => c + 1);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [count, isPaused]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (count <= 1) return;
    dragState.current = { startX: e.clientX, deltaX: 0, dragging: true };
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pauseThenResume();
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current.dragging) return;
    const delta = e.clientX - dragState.current.startX;
    dragState.current.deltaX = delta;
    setDragOffset(delta);
  };
  const endDrag = () => {
    if (!dragState.current.dragging) return;
    const delta = dragState.current.deltaX;
    const threshold = 60;
    if (delta > threshold) prev();
    else if (delta < -threshold) next();
    dragState.current = { startX: 0, deltaX: 0, dragging: false };
    setDragOffset(0);
  };

  if (count === 0) return null;

  const trackWidth = trackRef.current?.clientWidth ?? 0;
  const dragPercent = trackWidth > 0 ? (dragOffset / trackWidth) * 100 : 0;

  return (
    <div
      className="group absolute inset-0 h-full w-full touch-pan-y select-none overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onPointerCancel={endDrag}
    >
      <div
        ref={trackRef}
        className="flex h-full"
        style={{
          width: `${count * 100}%`,
          transform: `translateX(calc(${-index * (100 / count)}% + ${dragPercent}%))`,
          transition: dragState.current.dragging ? "none" : "transform 750ms cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {slides.map((slide, i) => (
          <div key={slide.id} className="relative h-full shrink-0 overflow-hidden" style={{ width: `${100 / count}%` }}>
            <div
              key={i === index ? cycle : undefined}
              className="absolute inset-0"
              style={
                i === index
                  ? {
                      animation: `heroKenBurns ${AUTOPLAY_MS + 600}ms ease-out forwards`,
                      animationPlayState: isPaused ? "paused" : "running",
                    }
                  : undefined
              }
            >
              <Image
                src={slide.imageUrl}
                alt={slide.alt}
                fill
                draggable={false}
                className="pointer-events-none object-cover"
                sizes="100vw"
                priority={i === 0}
              />
            </div>
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <div className="absolute inset-y-0 left-3 z-20 flex items-center md:left-5">
            <button
              type="button"
              aria-label="Previous slide"
              onClick={(e) => {
                e.stopPropagation();
                pauseThenResume();
                prev();
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/30 text-ink opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div className="absolute inset-y-0 right-3 z-20 flex items-center md:right-5">
            <button
              type="button"
              aria-label="Next slide"
              onClick={(e) => {
                e.stopPropagation();
                pauseThenResume();
                next();
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/30 text-ink opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Minimalist story-style progress bar — doubles as slide picker */}
          <div className="absolute inset-x-4 bottom-4 z-20 flex gap-1.5 md:inset-x-6 md:bottom-5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  pauseThenResume();
                  goTo(i);
                }}
                className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25"
              >
                {i < index && <span className="block h-full w-full bg-signal" />}
                {i === index && (
                  <span
                    key={`progress-${index}`}
                    className="block h-full bg-signal"
                    style={{
                      animation: `heroSliderProgress ${AUTOPLAY_MS}ms linear forwards`,
                      animationPlayState: isPaused ? "paused" : "running",
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
