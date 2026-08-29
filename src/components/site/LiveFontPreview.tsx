"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

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

// Cache keyed by the *actual file URL* (not just the caller-supplied
// family name). This is what makes real-time swaps work correctly: the
// font tester reuses the same `fontFamily` prop while the user switches
// between styles (Regular/Bold/Italic) or after an admin re-uploads a
// preview file, so a cache keyed only on the family name would keep
// showing the first font ever loaded under that name and silently
// ignore every later URL. Keying on the URL means each distinct file
// always gets its own applied @font-face, so switching styles or
// uploading a fresh file is reflected immediately.
const loadedFaces = new Map<string, string>();

/** Turn a WOFF2/WOFF/TTF/OTF URL into the correct CSS format() hint. A
 *  wrong hint (e.g. always claiming "woff2" for a .woff file) makes
 *  some browsers refuse to apply the font at all, which is why a real
 *  uploaded font could silently fail to show up in the live preview. */
function formatHintFor(url: string): string {
  const clean = url.split("?")[0].split("#")[0];
  const ext = (clean.split(".").pop() || "").toLowerCase();
  switch (ext) {
    case "woff2":
      return "woff2";
    case "woff":
      return "woff";
    case "ttf":
      return "truetype";
    case "otf":
      return "opentype";
    default:
      return "woff2";
  }
}

/** Derive a short, stable, CSS-safe suffix from a URL so repeated loads
 *  of the same file reuse the same generated family name. */
function hashSuffix(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Renders text set in a font that is only fetched once this element is
 * near the viewport (IntersectionObserver), so a page with dozens of
 * font cards never downloads every WOFF2 at once. Falls back to the
 * system font stack until the real font finishes loading, then swaps —
 * and re-loads whenever the underlying file URL changes (style switch,
 * re-upload, etc.), not just on first mount.
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
  const ref = useRef<HTMLDivElement>(null);
  const [appliedFamily, setAppliedFamily] = useState<string | null>(
    () => (woff2Url && loadedFaces.get(woff2Url)) || null
  );

  useEffect(() => {
    if (!woff2Url) {
      setAppliedFamily(null);
      return;
    }

    const cached = loadedFaces.get(woff2Url);
    if (cached) {
      setAppliedFamily(cached);
      return;
    }

    let cancelled = false;

    async function load(url: string) {
      try {
        const generatedFamily = `${fontFamily}-${hashSuffix(url)}`;
        const face = new FontFace(generatedFamily, `url(${url}) format('${formatHintFor(url)}')`);
        await face.load();
        if (cancelled) return;
        (document.fonts as any).add(face);
        loadedFaces.set(url, generatedFamily);
        setAppliedFamily(generatedFamily);
      } catch {
        // silently keep the fallback stack — a broken preview file
        // shouldn't break the page
      }
    }

    if (eager) {
      load(woff2Url);
      return () => {
        cancelled = true;
      };
    }

    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          load(woff2Url);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [woff2Url, fontFamily, eager]);

  const Tag = as;
  const loaded = Boolean(appliedFamily);

  return (
    <Tag
      ref={ref as any}
      className={cn("transition-opacity duration-300", className)}
      style={{
        fontFamily: appliedFamily ? `"${appliedFamily}", system-ui` : "system-ui",
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
