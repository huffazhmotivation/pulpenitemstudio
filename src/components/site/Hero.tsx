"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { loadFontFace } from "@/lib/useFontFace";
import { cn } from "@/lib/utils";

export interface HeroFont {
  id: string;
  name: string;
  slug: string;
  category: string;
  priceLabel: string;
  woff2Url: string | null;
}

interface HeroProps {
  fonts: HeroFont[];
  eyebrow: string;
  heading: string;
  subheading: string;
  fallbackName: string;
}

const AUTO_MS = 4200;

/**
 * Light-grey hero. The specimen is live: letters lift as the pointer passes,
 * any letter can be dragged to kern it, and the font changes by itself until
 * the visitor starts playing with it.
 */
export function Hero({ fonts, eyebrow, heading, subheading, fallbackName }: HeroProps) {
  const list: HeroFont[] = fonts.length
    ? fonts
    : [{ id: "fallback", name: fallbackName, slug: "", category: "", priceLabel: "", woff2Url: null }];
  const [idx, setIdx] = useState(0);
  const [auto, setAuto] = useState(true);
  const [text, setText] = useState("");
  const [family, setFamily] = useState<string | null>(null);
  const [moved, setMoved] = useState(false);

  const heroRef = useRef<HTMLElement>(null);
  const stgRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLSpanElement>(null);
  const raf = useRef(0);
  const drag = useRef<{ el: HTMLElement; x: number; y: number; ox: number; oy: number } | null>(null);

  const font = list[idx % list.length];
  const shown = text.trim() || font.name;

  // Load the current font file, keep the previous face on screen until it is ready.
  useEffect(() => {
    let cancelled = false;
    if (!font.woff2Url) {
      setFamily(null);
      return;
    }
    loadFontFace(`hero-${font.slug}`, font.woff2Url).then((f) => {
      if (!cancelled) setFamily(f);
    });
    return () => {
      cancelled = true;
    };
  }, [font.woff2Url, font.slug]);

  // Auto-advance until the visitor interacts.
  useEffect(() => {
    if (!auto || list.length < 2) return;
    const t = window.setTimeout(() => setIdx((i) => (i + 1) % list.length), AUTO_MS);
    return () => window.clearTimeout(t);
  }, [auto, idx, list.length]);

  const fit = useCallback(() => {
    const w = wordRef.current;
    const box = stgRef.current;
    if (!w || !box) return;
    w.style.whiteSpace = "nowrap";
    let size = Math.min(132, Math.max(56, window.innerWidth * 0.095));
    w.style.fontSize = `${size}px`;
    const room = box.clientWidth;
    const sw = w.scrollWidth;
    if (sw > room) size = Math.floor((size * room) / sw * 0.97);
    if (size < 34) {
      size = 34;
      w.style.whiteSpace = "normal";
    }
    w.style.fontSize = `${size}px`;
  }, []);

  useLayoutEffect(() => {
    fit();
  }, [fit, shown, family]);

  useEffect(() => {
    const onResize = () => fit();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [fit]);

  const letters = () => Array.from(wordRef.current?.querySelectorAll<HTMLElement>(".ch") ?? []);
  const place = (el: HTMLElement, extra = "") => {
    el.style.transform = `translate(${el.dataset.ox || 0}px,${el.dataset.oy || 0}px) ${extra}`;
  };

  function onPointerMove(e: React.PointerEvent<HTMLElement>) {
    const hero = heroRef.current;
    if (!hero) return;
    const r = hero.getBoundingClientRect();
    hero.style.setProperty("--mx", `${e.clientX - r.left}px`);
    hero.style.setProperty("--my", `${e.clientY - r.top}px`);
    if (drag.current || raf.current || e.pointerType !== "mouse") return;
    const x = e.clientX;
    const y = e.clientY;
    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      letters().forEach((el) => {
        const b = el.getBoundingClientRect();
        const dx = x - (b.left + b.width / 2);
        const dy = y - (b.top + b.height / 2);
        const k = Math.max(0, 1 - Math.hypot(dx, dy) / 230);
        const en = k * k * (3 - 2 * k);
        place(el, `translateY(${(-en * 0.07).toFixed(3)}em) scale(${(1 + en * 0.1).toFixed(3)}) rotate(${((dx > 0 ? -1 : 1) * en * 4).toFixed(2)}deg)`);
      });
    });
  }

  function calm() {
    letters().forEach((el) => place(el));
  }

  function tag(e: { clientX: number; clientY: number }, el: HTMLElement) {
    const t = tagRef.current;
    const box = stgRef.current;
    if (!t || !box) return;
    const size = parseFloat(wordRef.current?.style.fontSize || "80") || 80;
    const kx = Math.round((Number(el.dataset.ox || 0) / size) * 1000);
    const ky = Math.round((-Number(el.dataset.oy || 0) / size) * 1000);
    const r = box.getBoundingClientRect();
    t.textContent = `kern ${kx > 0 ? "+" : ""}${kx}  ·  shift ${ky > 0 ? "+" : ""}${ky}`;
    t.style.left = `${e.clientX - r.left + 16}px`;
    t.style.top = `${e.clientY - r.top - 38}px`;
    t.style.opacity = "1";
  }

  function onWordDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "touch") return; // keep the page scrollable on phones
    const el = (e.target as HTMLElement).closest<HTMLElement>(".ch");
    if (!el) return;
    e.preventDefault();
    setAuto(false);
    calm();
    drag.current = { el, x: e.clientX, y: e.clientY, ox: Number(el.dataset.ox || 0), oy: Number(el.dataset.oy || 0) };
    el.classList.add("grabbing");
    wordRef.current?.classList.add("word-dragging");
    tag(e, el);
  }

  useEffect(() => {
    function move(e: PointerEvent) {
      const d = drag.current;
      if (!d) return;
      const size = parseFloat(wordRef.current?.style.fontSize || "80") || 80;
      d.el.dataset.ox = String(Math.max(-size * 1.5, Math.min(size * 1.5, d.ox + e.clientX - d.x)));
      d.el.dataset.oy = String(Math.max(-size * 0.8, Math.min(size * 0.8, d.oy + e.clientY - d.y)));
      place(d.el, "scale(1.06)");
      setMoved(true);
      tag(e, d.el);
    }
    function up() {
      const d = drag.current;
      if (!d) return;
      place(d.el);
      d.el.classList.remove("grabbing");
      wordRef.current?.classList.remove("word-dragging");
      drag.current = null;
      if (tagRef.current) tagRef.current.style.opacity = "0";
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  function resetLetters() {
    letters().forEach((el) => {
      el.dataset.ox = "0";
      el.dataset.oy = "0";
      el.style.transform = "";
    });
    setMoved(false);
  }

  function go(d: number) {
    setAuto(false);
    setMoved(false);
    setIdx((i) => (i + d + list.length) % list.length);
  }

  return (
    <section
      ref={heroRef}
      onPointerMove={onPointerMove}
      onPointerLeave={calm}
      className="relative grid items-center gap-10 overflow-hidden rounded-[40px] bg-[linear-gradient(135deg,#F9FAFB,#E6E8ED)] p-6 shadow-[inset_0_0_0_1px_rgba(22,24,30,.05),0_1px_2px_rgba(22,24,30,.04),0_12px_32px_-16px_rgba(22,24,30,.16)] sm:p-10 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] lg:p-16"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(440px_circle_at_var(--mx,72%)_var(--my,35%),rgba(255,255,255,.95),transparent_62%)]"
      />

      <div className="relative">
        <span className="inline-flex h-9 items-center gap-2 rounded-full bg-panel pl-2 pr-4 text-[13px] font-semibold text-ink ring-1 ring-inset ring-line">
          <i className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] not-italic text-white">✦</i>
          {eyebrow}
        </span>
        <h1 className="mb-4 mt-5 text-balance text-[clamp(2.1rem,4.6vw,3.75rem)] font-extrabold leading-[1.04] tracking-[-0.035em] text-ink">
          {heading}
        </h1>
        <p className="max-w-[44ch] text-[17px] text-ink-soft">{subheading}</p>
        <div className="mt-7 hidden flex-wrap gap-2.5 lg:flex">
          <Link href="/fonts" className="group/btn inline-flex h-12 items-center gap-3 rounded-full bg-ink pl-6 pr-1.5 text-sm font-semibold text-white hover:bg-ink/85">
            Browse fonts
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink transition-transform group-hover/btn:translate-x-0.5">→</span>
          </Link>
          {font.slug && (
            <Link href={`/fonts/${font.slug}`} className="inline-flex h-12 items-center rounded-full bg-panel px-6 text-sm font-semibold text-ink ring-1 ring-inset ring-line hover:ring-ink-faint">
              Open {font.name}
            </Link>
          )}
        </div>
      </div>

      <div ref={stgRef} className="relative min-w-0">
        <div
          ref={wordRef}
          onPointerDown={onWordDown}
          role="img"
          aria-label={`${font.name} specimen`}
          className="inline-block select-none align-top font-normal leading-[1.02] tracking-[-0.02em] text-ink [touch-action:pan-y]"
          style={{ fontFamily: family ? `"${family}", system-ui` : "system-ui", minHeight: "1.15em" }}
        >
          {Array.from(shown).map((ch, i) =>
            ch === " " ? (
              <Fragment key={`${font.id}-${i}`}> </Fragment>
            ) : (
              <span key={`${font.id}-${shown}-${i}`} className="ch ch-in" style={{ animationDelay: `${i * 30}ms` }}>
                {ch}
              </span>
            )
          )}
        </div>

        <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-ink/15 pt-3.5">
          {auto && list.length > 1 && (
            <i
              key={idx}
              className="absolute -top-px left-0 h-0.5 w-full origin-left bg-ink"
              style={{ animation: `heroProg ${AUTO_MS}ms linear forwards` }}
            />
          )}
          <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 text-sm text-ink-soft">
            <b className="text-lg tracking-tight text-ink">{font.name}</b>
            {font.category && <span>{font.category}</span>}
            {font.priceLabel && <span>{font.priceLabel}</span>}
          </div>
          {list.length > 1 && (
            <div className="flex shrink-0 gap-0.5">
              <button onClick={() => go(-1)} aria-label="Previous font" className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-ink hover:bg-ink/10">‹</button>
              <button onClick={() => setAuto((a) => !a)} aria-label={auto ? "Pause slideshow" : "Play slideshow"} className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-ink/10">
                {auto ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect x="2" y="1" width="3" height="10" rx="1" /><rect x="7" y="1" width="3" height="10" rx="1" /></svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M3 1.5l8 4.5-8 4.5z" /></svg>
                )}
              </button>
              <button onClick={() => go(1)} aria-label="Next font" className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-ink hover:bg-ink/10">›</button>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-7 gap-y-3">
          <input
            value={text}
            maxLength={30}
            onChange={(e) => {
              setAuto(false);
              setText(e.target.value);
            }}
            placeholder="Type your own text"
            aria-label="Your preview text"
            className="h-10 min-w-0 flex-1 basis-52 border-0 border-b-2 border-ink/30 bg-transparent px-0 text-base text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
          />
          {moved ? (
            <button onClick={resetLetters} className="text-[13px] font-bold text-ink underline underline-offset-4">
              Reset letters
            </button>
          ) : (
            <span className="hidden text-[13px] text-ink-faint [@media(hover:hover)]:inline">Drag any letter to kern it</span>
          )}
        </div>

          <div className="mt-6 flex flex-wrap gap-2.5 lg:hidden">
            <Link href="/fonts" className="group/btn inline-flex h-12 items-center gap-3 rounded-full bg-ink pl-6 pr-1.5 text-sm font-semibold text-white hover:bg-ink/85">
              Browse fonts
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink transition-transform group-hover/btn:translate-x-0.5">→</span>
            </Link>
            {font.slug && (
              <Link href={`/fonts/${font.slug}`} className="inline-flex h-12 items-center rounded-full bg-panel px-6 text-sm font-semibold text-ink ring-1 ring-inset ring-line hover:ring-ink-faint">
                Open {font.name}
              </Link>
            )}
          </div>
        <span
          ref={tagRef}
          aria-hidden
          className={cn(
            "pointer-events-none absolute z-20 whitespace-pre rounded-full bg-ink px-3 py-1.5 text-[11px] font-bold text-white opacity-0 transition-opacity"
          )}
        />
      </div>

      <style>{`@keyframes heroProg{from{transform:scaleX(0)}to{transform:scaleX(1)}}`}</style>
    </section>
  );
}
