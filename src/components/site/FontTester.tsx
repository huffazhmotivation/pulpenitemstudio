"use client";

import { useState } from "react";
import { LiveFontPreview } from "@/components/site/LiveFontPreview";
import { publicStorageUrl, BUCKETS } from "@/lib/storage";
import type { FontFile, FontStyle } from "@/lib/types/database";

interface FontTesterProps {
  fontSlug: string;
  styles: FontStyle[];
  files: FontFile[];
  defaultText: string;
  /** General (non style-specific) preview file URL, used as a fallback so the
   *  live preview never silently falls back to a system font. */
  fallbackWoff2Url?: string | null;
}

export function FontTester({ fontSlug, styles, files, defaultText, fallbackWoff2Url = null }: FontTesterProps) {
  const sortedStyles = [...styles].sort((a, b) => a.sort_order - b.sort_order);
  const [text, setText] = useState(defaultText || "The quick brown fox jumps over the lazy dog");
  const [size, setSize] = useState(64);
  const [styleId, setStyleId] = useState(sortedStyles[0]?.id ?? "");

  const activeStyle = sortedStyles.find((s) => s.id === styleId) ?? sortedStyles[0];
  // Prefer a preview file matched to the selected style; fall back to any
  // style-agnostic preview file for that style, then to the font's general
  // preview file, so the tester always shows the real uploaded font.
  const previewFile =
    files.find((f) => f.file_type === "preview" && f.style_id === activeStyle?.id) ??
    files.find((f) => f.file_type === "preview" && !f.style_id) ??
    files.find((f) => f.file_type === "preview");
  const woff2Url = previewFile
    ? publicStorageUrl(BUCKETS.previews, previewFile.storage_path)
    : fallbackWoff2Url;

  return (
    <div className="overflow-hidden rounded-2xl bg-panel shadow-card">
      <div className="min-h-[240px] w-full overflow-hidden px-6 py-10 sm:px-10">
        <LiveFontPreview
          fontFamily={`tester-${fontSlug}`}
          woff2Url={woff2Url}
          text={text}
          fontSize={size}
          weight={activeStyle?.weight ?? 400}
          italic={activeStyle?.is_italic ?? false}
          eager
          className="block w-full break-words text-ink [overflow-wrap:anywhere]"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 bg-panel-2 p-5 sm:p-6 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <label className="eyebrow mb-1.5 block">Preview text</label>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-11 w-full rounded-full bg-panel px-5 text-sm text-ink ring-1 ring-inset ring-line hover:ring-ink-faint focus:outline-none focus:ring-2 focus:ring-signal"
          />
        </div>

        <div>
          <label className="eyebrow mb-1.5 block">Size · {size}px</label>
          <input
            type="range"
            min={12}
            max={160}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="mt-3 w-full accent-ink"
          />
        </div>

        <div>
          <label className="eyebrow mb-1.5 block">Style</label>
          <select
            value={styleId}
            onChange={(e) => setStyleId(e.target.value)}
            className="h-11 w-full rounded-full bg-panel px-4 text-sm text-ink ring-1 ring-inset ring-line hover:ring-ink-faint focus:outline-none focus:ring-2 focus:ring-signal"
          >
            {sortedStyles.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
