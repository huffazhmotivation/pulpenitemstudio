import { LiveFontPreview } from "@/components/site/LiveFontPreview";

const ROWS: { label: string; text: string; size: number }[] = [
  { label: "Uppercase", text: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", size: 32 },
  { label: "Lowercase", text: "abcdefghijklmnopqrstuvwxyz", size: 32 },
  { label: "Numbers", text: "0123456789", size: 32 },
  { label: "Punctuation", text: "!?&@#$%.,;:'\"()–—/*", size: 32 },
];

// A generic accented-Latin sample — not language-specific copy, just enough
// diacritic coverage to show the font handles extended Latin gracefully.
const MULTILINGUAL_SAMPLE = "Àâäåçéèêëîïñôöùûü — Straße, café, açaí";

export function GlyphPreview({
  fontFamily,
  woff2Url,
  languageSupport = [],
}: {
  fontFamily: string;
  woff2Url: string | null;
  languageSupport?: string[];
}) {
  return (
    <div className="divide-y divide-line overflow-hidden rounded-2xl bg-panel shadow-card">
      {ROWS.map((row) => (
        <div
          key={row.label}
          className="grid grid-cols-1 gap-2 px-6 py-5 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center sm:gap-6"
        >
          <p className="eyebrow">{row.label}</p>
          <LiveFontPreview
            fontFamily={fontFamily}
            woff2Url={woff2Url}
            text={row.text}
            fontSize={row.size}
            className="min-w-0 tracking-wide text-ink [overflow-wrap:anywhere]"
          />
        </div>
      ))}

      {languageSupport.length > 0 && (
        <div className="grid grid-cols-1 gap-2 px-6 py-5 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center sm:gap-6">
          <div>
            <p className="eyebrow">Multilingual</p>
            <p className="mt-1 text-xs text-ink-soft">{languageSupport.join(", ")}</p>
          </div>
          <LiveFontPreview
            fontFamily={fontFamily}
            woff2Url={woff2Url}
            text={MULTILINGUAL_SAMPLE}
            fontSize={28}
            className="min-w-0 tracking-wide text-ink [overflow-wrap:anywhere]"
          />
        </div>
      )}
    </div>
  );
}
