"use client";

import { cn } from "@/lib/utils";
import { useFontFace } from "@/lib/useFontFace";

interface LiveFontPreviewProps {
  /** Unique CSS font-family name — use the font slug + style so multiple previews never collide. */
  fontFamily: string;
  /** Public WOFF2 (or WOFF) URL from the font-previews storage bucket. */
  woff2Url: string | null;
  text: string;
  fontSize?: number;
  weight?: number;
  italic?: boolean;
  className?: string;
  as?: "div" | "h1" | "h2" | "h3" | "p" | "span";
  /** Load immediately instead of waiting for the element to scroll into view. */
  eager?: boolean;
}

/**
 * Renders text set in a font that is only fetched once this element is
 * near the viewport, so a page with dozens of font cards never downloads
 * every WOFF2 at once. Falls back to the system font stack until the real
 * font finishes loading, then swaps, and re-loads whenever the file URL changes.
 */
export function LiveFontPreview({
  fontFamily,
  woff2Url,
  text,
  fontSize = 48,
  weight = 400,
  italic = false,
  className,
  as = "div",
  eager = false,
}: LiveFontPreviewProps) {
  const { family, ref } = useFontFace<HTMLDivElement>(fontFamily, woff2Url, eager);
  const Tag = as;
  const loaded = Boolean(family);

  return (
    <Tag
      ref={ref as never}
      className={cn("transition-opacity duration-300", className)}
      style={{
        fontFamily: family ? `"${family}", system-ui` : "system-ui",
        fontSize,
        fontWeight: weight,
        fontStyle: italic ? "italic" : "normal",
        opacity: loaded || !woff2Url ? 1 : 0.55,
        lineHeight: 1.1,
      }}
    >
      {text}
    </Tag>
  );
}
