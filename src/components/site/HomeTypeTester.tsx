"use client";

import { useMemo, useState } from "react";
import { LiveFontPreview } from "@/components/site/LiveFontPreview";
import { Select } from "@/components/ui/Select";
import { publicStorageUrl, BUCKETS } from "@/lib/storage";
import type { FontWithRelations } from "@/lib/types/database";

export function HomeTypeTester({ fonts }: { fonts: FontWithRelations[] }) {
  const [fontId, setFontId] = useState(fonts[0]?.id ?? "");
  const [text, setText] = useState("Type, made with intent.");
  const [size, setSize] = useState(88);

  const activeFont = fonts.find((f) => f.id === fontId) ?? fonts[0];
  const sortedStyles = useMemo(
    () => (activeFont ? [...activeFont.styles].sort((a, b) => a.sort_order - b.sort_order) : []),
    [activeFont]
  );
  const [styleId, setStyleId] = useState(sortedStyles[0]?.id ?? "");
  const activeStyle = sortedStyles.find((s) => s.id === styleId) ?? sortedStyles[0];

  function handleFontChange(id: string) {
    setFontId(id);
    const font = fonts.find((f) => f.id === id);
    const first = font ? [...font.styles].sort((a, b) => a.sort_order - b.sort_order)[0] : undefined;
    setStyleId(first?.id ?? "");
  }

  if (!activeFont) return null;

  const previewFile = activeFont.files.find(
    (f) => f.file_type === "preview" && (activeStyle ? f.style_id === activeStyle.id : true)
  );
  const woff2Url = previewFile ? publicStorageUrl(BUCKETS.previews, previewFile.storage_path) : null;

  return (
    <div className="border border-line">
      <div className="min-h-[280px] overflow-x-auto border-b border-line bg-paper px-6 py-12 md:px-10">
        <LiveFontPreview
          fontFamily={`homefonttester-${activeFont.slug}`}
          woff2Url={woff2Url}
          text={text}
          fontSize={size}
          weight={activeStyle?.weight ?? 400}
          italic={activeStyle?.is_italic ?? false}
          eager
          className="whitespace-pre-wrap break-words text-ink"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-[2fr_1fr_1fr_1fr] md:p-8">
        <div>
          <label className="eyebrow mb-1.5 block">Preview text</label>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full border border-line bg-transparent px-3 py-2 text-sm text-ink focus:outline-none focus:border-signal"
          />
        </div>

        <div>
          <label className="eyebrow mb-1.5 block">Typeface</label>
          <Select value={fontId} onChange={(e) => handleFontChange(e.target.value)}>
            {fonts.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="eyebrow mb-1.5 block">Style</label>
          <Select value={styleId} onChange={(e) => setStyleId(e.target.value)}>
            {sortedStyles.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="eyebrow mb-1.5 block">Size — {size}px</label>
          <input
            type="range"
            min={24}
            max={200}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="mt-3 w-full accent-signal"
          />
        </div>
      </div>
    </div>
  );
}
