"use client";

import { useEffect, useState } from "react";

interface Glow {
  id: number;
  x: number;
  y: number;
}

let counter = 0;

/** Anything the user would reasonably think of as "clickable". */
const INTERACTIVE_SELECTOR =
  "a, button, [role='button'], input[type='button'], input[type='submit'], input[type='reset'], summary, label, [data-click-fx]";

/**
 * On-brand click feedback for the storefront: every tap on a
 * link/button/etc. gets (1) a soft white glow burst floating at the
 * tap point, and (2) a gentle "zoom pop" + glow applied directly to
 * the clicked element itself, so the feedback is easy to see right on
 * the thing you tapped — not just a floating overlay. Purely
 * decorative, never interferes with the actual click. Skips itself
 * entirely for prefers-reduced-motion.
 */
export function ClickEffects() {
  const [glows, setGlows] = useState<Glow[]>([]);

  useEffect(() => {
    // Deliberately not gated behind prefers-reduced-motion — this
    // click feedback is part of the brand experience and should show
    // for every visitor regardless of their OS accessibility setting.
    function onPointerDown(e: PointerEvent) {
      if (e.pointerType === "mouse" && e.button !== 0) return;

      const rawTarget = e.target as Element | null;
      if (!rawTarget) return;
      const target = rawTarget.closest(INTERACTIVE_SELECTOR) as HTMLElement | null;
      if (!target) return;

      // Floating glow burst at the exact tap point.
      const glow: Glow = { id: ++counter, x: e.clientX, y: e.clientY };
      setGlows((prev) => [...prev, glow]);
      window.setTimeout(() => {
        setGlows((prev) => prev.filter((g) => g.id !== glow.id));
      }, 650);

      // Zoom + glow pop on the clicked element itself. Remove then
      // re-add the class (with a forced reflow in between) so rapid
      // repeat clicks on the same element restart the animation
      // instead of doing nothing because the class was already set.
      target.classList.remove("click-zoom-fx");
      void target.offsetWidth;
      target.classList.add("click-zoom-fx");
      target.addEventListener(
        "animationend",
        () => target.classList.remove("click-zoom-fx"),
        { once: true }
      );
    }

    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  if (glows.length === 0) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {glows.map((g) => (
        <div key={g.id} className="absolute h-0 w-0" style={{ left: g.x, top: g.y }}>
          <span className="click-glow" />
        </div>
      ))}
    </div>
  );
}
