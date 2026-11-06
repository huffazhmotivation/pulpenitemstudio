import type { CSSProperties } from "react";

/** The six built-in preview compositions, drawn from the font itself. */
export const SLIDE_KINDS = ["cover", "poster", "pack", "sign", "mag", "sheet"] as const;
export type SlideKind = (typeof SLIDE_KINDS)[number];
export const SLIDE_LABELS: Record<SlideKind, string> = {
  cover: "Cover",
  poster: "Poster",
  pack: "Packaging",
  sign: "Storefront",
  mag: "Magazine",
  sheet: "Alphabet",
};

/** Soft pastel backgrounds, picked per font so a grid of cards feels varied. */
export const TINTS = ["#E9EBEF", "#FFF1BF", "#DDF5EC", "#ECE6FF", "#FFE6EC", "#ECEEF1", "#FFE9D9", "#E8F0D8", "#E4E6EA"];

export function tintFor(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return TINTS[Math.abs(h) % TINTS.length];
}

interface SlideProps {
  kind: SlideKind;
  /** Resolved CSS font-family value for the font (already loaded), or null for a system fallback. */
  family: string | null;
  name: string;
  category: string;
  tint: string;
  /** Visitor text for the cover slide. */
  text?: string;
}

const UI = "var(--font-sans), system-ui, sans-serif";

const abs = (s: CSSProperties): CSSProperties => ({ position: "absolute", ...s });

/** A preview composition. Every size is in container-query units (cqw) so it scales with its box. */
export function FontSlide({ kind, family, name, category, tint, text }: SlideProps) {
  const F: CSSProperties = { fontFamily: family ? `"${family}", system-ui` : "system-ui", fontWeight: 400 };
  const t = (text ?? "").trim() || name;
  const cqw = (n: number) => `${n}cqw`;

  return (
    <div className="slide">
      {kind === "cover" && (
        <div className="slide-inner" style={{ background: tint }}>
          <div style={{ ...F, fontSize: cqw(11), lineHeight: 1.05, textAlign: "center", padding: `0 ${cqw(7)}`, color: "#16181E", overflowWrap: "anywhere" }}>{t}</div>
          <div style={abs({ left: cqw(6), bottom: cqw(5), ...F, fontSize: cqw(4.2), color: "#16181E", opacity: 0.7 })}>Aa Bb Cc 123</div>
          <div style={abs({ right: cqw(6), bottom: cqw(5), fontFamily: UI, fontSize: cqw(2.6), fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#16181E", opacity: 0.55 })}>{category}</div>
        </div>
      )}

      {kind === "poster" && (
        <div className="slide-inner" style={{ background: "#E6E8EC" }}>
          <div style={abs({ left: cqw(20), top: cqw(10), width: cqw(30), height: cqw(42), background: tint, transform: "rotate(-7deg)", borderRadius: cqw(1), boxShadow: `0 ${cqw(2)} ${cqw(5)} rgba(22,24,30,.25)` })} />
          <div style={abs({ left: cqw(32), top: cqw(8), width: cqw(36), height: cqw(52), background: "#16181E", borderRadius: cqw(1), transform: "rotate(3deg)", boxShadow: `0 ${cqw(3)} ${cqw(7)} rgba(22,24,30,.35)`, padding: cqw(3.5), display: "flex", flexDirection: "column", justifyContent: "space-between", color: "#fff" })}>
            <div style={{ ...F, fontSize: cqw(6.6), lineHeight: 1.02, overflowWrap: "anywhere" }}>Fresh<br />ideas,<br />daily.</div>
            <div style={{ fontFamily: UI, fontSize: cqw(1.7), fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.7 }}>{name}</div>
          </div>
        </div>
      )}

      {kind === "pack" && (
        <div className="slide-inner" style={{ background: tint }}>
          <div style={abs({ left: cqw(30), top: cqw(8), width: cqw(40), height: cqw(58), borderRadius: `${cqw(3)} ${cqw(3)} ${cqw(5)} ${cqw(5)}`, background: "linear-gradient(160deg,#2B2E38,#16181E)", boxShadow: `0 ${cqw(3)} ${cqw(6)} rgba(22,24,30,.35)` })}>
            <div style={abs({ top: 0, left: 0, right: 0, height: cqw(4), background: "rgba(255,255,255,.22)", borderRadius: `${cqw(3)} ${cqw(3)} 0 0` })} />
            <div style={abs({ left: cqw(4), right: cqw(4), top: cqw(15), bottom: cqw(6), background: "#fff", borderRadius: cqw(2), display: "grid", placeContent: "center", textAlign: "center", padding: cqw(2) })}>
              <div style={{ ...F, fontSize: cqw(5.4), lineHeight: 1.05, color: "#16181E", overflowWrap: "anywhere" }}>{name}</div>
              <div style={{ fontFamily: UI, fontSize: cqw(1.8), fontWeight: 700, color: "#586073", marginTop: cqw(1.2), letterSpacing: ".06em", textTransform: "uppercase" }}>Small batch · 250 g</div>
            </div>
          </div>
          <div style={abs({ left: cqw(33), top: cqw(67), width: cqw(34), height: cqw(3), borderRadius: "50%", background: "rgba(22,24,30,.2)", filter: `blur(${cqw(1)})` })} />
        </div>
      )}

      {kind === "sign" && (
        <div className="slide-inner" style={{ background: "linear-gradient(#E1E3E8,#F2F3F5)" }}>
          <div style={abs({ left: cqw(12), right: cqw(12), top: cqw(9), height: cqw(11), background: `repeating-linear-gradient(90deg,#FFD84D 0 ${cqw(6)},#fff ${cqw(6)} ${cqw(12)})`, borderRadius: `${cqw(1)} ${cqw(1)} ${cqw(3)} ${cqw(3)}`, boxShadow: `0 ${cqw(1.5)} ${cqw(3)} rgba(22,24,30,.2)` })} />
          <div style={abs({ left: cqw(18), right: cqw(18), top: cqw(23), height: cqw(14), background: "#16181E", borderRadius: cqw(1.5), display: "grid", placeItems: "center", color: "#fff", ...F, fontSize: cqw(5.2), whiteSpace: "nowrap", overflow: "hidden" })}>{name}</div>
          <div style={abs({ left: cqw(12), right: cqw(12), top: cqw(41), bottom: 0, background: "#fff", borderRadius: `${cqw(2)} ${cqw(2)} 0 0`, boxShadow: `0 -${cqw(1)} ${cqw(4)} rgba(22,24,30,.12)` })}>
            <div style={abs({ left: cqw(5), top: cqw(5), width: cqw(26), height: cqw(20), background: "linear-gradient(#E1E3E8,#F5F6F8)", borderRadius: cqw(1) })} />
            <div style={abs({ right: cqw(5), top: cqw(5), bottom: 0, width: cqw(15), background: "#16181E", borderRadius: `${cqw(1)} ${cqw(1)} 0 0`, display: "grid", placeItems: "center", color: "#fff", fontFamily: UI, fontSize: cqw(2.6), fontWeight: 800, letterSpacing: ".08em" })}>OPEN</div>
          </div>
        </div>
      )}

      {kind === "mag" && (
        <div className="slide-inner" style={{ background: "#E8EAEE" }}>
          <div style={abs({ left: cqw(9), top: cqw(8), width: cqw(40), height: cqw(58), background: "#fff", boxShadow: `0 ${cqw(2)} ${cqw(5)} rgba(22,24,30,.18)`, padding: cqw(4) })}>
            <div style={{ ...F, fontSize: cqw(5.4), lineHeight: 1.05, color: "#16181E", overflowWrap: "anywhere" }}>{name}</div>
            <div style={{ marginTop: cqw(3), height: cqw(30), background: `repeating-linear-gradient(#D9DEE8 0 ${cqw(0.7)},transparent ${cqw(0.7)} ${cqw(2.6)})` }} />
          </div>
          <div style={abs({ left: cqw(51), top: cqw(8), width: cqw(40), height: cqw(58), background: "#fff", boxShadow: `0 ${cqw(2)} ${cqw(5)} rgba(22,24,30,.18)`, padding: cqw(4) })}>
            <div style={{ height: cqw(22), background: tint, borderRadius: cqw(1), display: "grid", placeItems: "center", ...F, fontSize: cqw(13), color: "#16181E", lineHeight: 1 }}>Aa</div>
            <div style={{ marginTop: cqw(3), height: cqw(20), background: `repeating-linear-gradient(#D9DEE8 0 ${cqw(0.7)},transparent ${cqw(0.7)} ${cqw(2.6)})` }} />
          </div>
        </div>
      )}

      {kind === "sheet" && (
        <div className="slide-inner" style={{ background: "#fff", padding: cqw(7), alignContent: "center", placeItems: "center start" }}>
          <div style={{ ...F, fontSize: cqw(6.4), lineHeight: 1.25, color: "#16181E", overflowWrap: "anywhere", width: "100%" }}>
            ABCDEFGHIJKLM<br />NOPQRSTUVWXYZ<br />abcdefghijklm<br />nopqrstuvwxyz<br />0123456789 &amp;@!?
          </div>
        </div>
      )}
    </div>
  );
}
