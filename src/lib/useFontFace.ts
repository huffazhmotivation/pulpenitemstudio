"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

// Cache keyed by the actual file URL. Each distinct file always gets its own
// @font-face, so switching styles or re-uploading a preview is reflected
// immediately, while repeated loads of the same file are free.
const loadedFaces = new Map<string, string>();

/** Turn a font file URL into the correct CSS format() hint. */
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

function hashSuffix(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

/** Load a font file into the document and resolve the generated family name. */
export async function loadFontFace(fontFamily: string, url: string): Promise<string | null> {
  const cached = loadedFaces.get(url);
  if (cached) return cached;
  try {
    const generated = `${fontFamily}-${hashSuffix(url)}`;
    const face = new FontFace(generated, `url(${url}) format('${formatHintFor(url)}')`);
    await face.load();
    (document.fonts as unknown as { add(f: FontFace): void }).add(face);
    loadedFaces.set(url, generated);
    return generated;
  } catch {
    return null;
  }
}

/**
 * Returns the CSS family name once the font file has loaded (or null while it
 * loads or when there is no file). With `eager` the file loads immediately,
 * otherwise only when the returned ref's element is near the viewport.
 */
export function useFontFace<T extends HTMLElement = HTMLElement>(
  fontFamily: string,
  url: string | null,
  eager = false
): { family: string | null; ref: RefObject<T> } {
  const ref = useRef<T>(null);
  const [family, setFamily] = useState<string | null>(() => (url && loadedFaces.get(url)) || null);

  useEffect(() => {
    if (!url) {
      setFamily(null);
      return;
    }
    const cached = loadedFaces.get(url);
    if (cached) {
      setFamily(cached);
      return;
    }
    let cancelled = false;
    const run = async () => {
      const f = await loadFontFace(fontFamily, url);
      if (!cancelled && f) setFamily(f);
    };
    if (eager) {
      run();
      return () => {
        cancelled = true;
      };
    }
    const el = ref.current;
    if (!el) {
      run();
      return () => {
        cancelled = true;
      };
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          run();
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
  }, [url, fontFamily, eager]);

  return { family, ref };
}
