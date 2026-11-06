"use client";

import { useMemo, useRef, useState } from "react";
import { GLYPHS } from "@/lib/glyphs";
import { cn } from "@/lib/utils";

interface Node {
  x: number;
  y: number;
  i: [number, number] | null;
  o: [number, number] | null;
  s: boolean;
}

const BASE_Y = 310;
const CX = 220;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function load(ch: string): Node[][] {
  return GLYPHS[ch].c.map((c) =>
    c.map((a) => ({
      x: a[0],
      y: a[1],
      i: a[2] == null ? null : [a[2], a[3] as number],
      o: a[4] == null ? null : [a[4], a[5] as number],
      s: !!a[6],
    }))
  );
}

/** Drag points of a real letter outline, then export it. Anchors and bezier handles are editable. */
export function GlyphLab() {
  const [ch, setCh] = useState("O");
  const [cons, setCons] = useState<Node[][]>(() => load("O"));
  const [sel, setSel] = useState<{ c: number; n: number } | null>(null);
  const [weight, setWeight] = useState(0);
  const [width, setWidth] = useState(100);
  const [slant, setSlant] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const drag = useRef<{ k: "a" | "i" | "o"; c: number; n: number } | null>(null);

  const k = width / 100;
  const t = Math.tan((slant * Math.PI) / 180);
  const tf = (x: number, y: number): [number, number] => [CX + (x - CX) * k + (BASE_Y - y) * t, y];
  const itf = (X: number, Y: number): [number, number] => [CX + (X - (BASE_Y - Y) * t - CX) / k, Y];

  const d = useMemo(() => {
    const P = (p: [number, number]) => {
      const q = tf(p[0], p[1]);
      return `${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
    };
    return cons
      .map((ns) => {
        let s = `M${P([ns[0].x, ns[0].y])}`;
        for (let j = 0; j < ns.length; j++) {
          const a = ns[j];
          const b = ns[(j + 1) % ns.length];
          const c1 = a.o;
          const c2 = b.i;
          s += c1 || c2 ? ` C${P(c1 ?? [a.x, a.y])} ${P(c2 ?? [b.x, b.y])} ${P([b.x, b.y])}` : ` L${P([b.x, b.y])}`;
        }
        return `${s}Z`;
      })
      .join(" ");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cons, k, t]);

  function pick(next: string) {
    setCh(next);
    setCons(load(next));
    setSel(null);
  }

  function reset() {
    setWeight(0);
    setWidth(100);
    setSlant(0);
    pick(ch);
  }

  function pt(e: React.PointerEvent) {
    const svg = svgRef.current!;
    const p = svg.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const q = p.matrixTransform(svg.getScreenCTM()!.inverse());
    return [Math.max(6, Math.min(434, q.x)), Math.max(6, Math.min(374, q.y))] as const;
  }

  function onDown(e: React.PointerEvent<SVGSVGElement>) {
    const target = (e.target as Element).closest<SVGElement>("[data-k]");
    if (!target) {
      setSel(null);
      return;
    }
    const g = target.closest<SVGElement>("[data-c]");
    if (!g) return;
    e.preventDefault();
    try {
      (target as unknown as Element).setPointerCapture(e.pointerId);
    } catch {
      /* some browsers refuse capture on SVG nodes */
    }
    const c = Number(g.dataset.c);
    const n = Number(g.dataset.n);
    drag.current = { k: target.dataset.k as "a" | "i" | "o", c, n };
    setSel({ c, n });
  }

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const dg = drag.current;
    if (!dg) return;
    const [X, Y] = pt(e);
    const [x, y] = itf(X, Y);
    setCons((prev) => {
      const next = prev.map((ns) => ns.map((n) => ({ ...n })));
      const n = next[dg.c][dg.n];
      if (dg.k === "a") {
        const dx = x - n.x;
        const dy = y - n.y;
        n.x = x;
        n.y = y;
        if (n.i) n.i = [n.i[0] + dx, n.i[1] + dy];
        if (n.o) n.o = [n.o[0] + dx, n.o[1] + dy];
      } else {
        const mine = dg.k;
        const other = mine === "i" ? "o" : "i";
        n[mine] = [x, y];
        const og = n[other];
        if (n.s && og) {
          const vx = x - n.x;
          const vy = y - n.y;
          const len = Math.hypot(vx, vy) || 1;
          const lo = Math.hypot(og[0] - n.x, og[1] - n.y);
          n[other] = [n.x - (vx / len) * lo, n.y - (vy / len) * lo];
        }
      }
      return next;
    });
  }

  function buildSvg() {
    const b = pathRef.current!.getBBox();
    const pad = 28 + weight / 2;
    const x = b.x - pad;
    const y = b.y - pad;
    const w = b.width + pad * 2;
    const h = b.height + pad * 2;
    return {
      w,
      h,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}" width="${Math.round(w)}" height="${Math.round(h)}"><path d="${d}" fill="#16181E" stroke="#16181E" stroke-width="${weight}" stroke-linejoin="miter" stroke-miterlimit="4"/></svg>`,
    };
  }

  function save(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async function exportPng() {
    try {
      const { svg, w, h } = buildSvg();
      const sc = 1400 / Math.max(w, h);
      const img = new Image();
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      await img.decode();
      const cv = document.createElement("canvas");
      cv.width = Math.round(w * sc);
      cv.height = Math.round(h * sc);
      cv.getContext("2d")!.drawImage(img, 0, 0, cv.width, cv.height);
      const blob = await new Promise<Blob | null>((r) => cv.toBlob(r, "image/png"));
      if (blob) {
        save(blob, `pulpenitem-${ch}.png`);
        flash("PNG saved");
      }
    } catch {
      flash("Could not export");
    }
  }

  function exportSvg() {
    save(new Blob([buildSvg().svg], { type: "image/svg+xml" }), `pulpenitem-${ch}.svg`);
    flash("SVG saved");
  }

  function flash(m: string) {
    setMsg(m);
    window.setTimeout(() => setMsg(null), 1800);
  }

  return (
    <div
      className="grid min-w-0 items-center gap-5 rounded-[32px] bg-[linear-gradient(135deg,#EDEEF1,#DCDFE5)] p-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,236px)] sm:p-7"
    >
      <div className="grid h-full min-w-0 content-between gap-4">
        <div>
          <span className="inline-flex h-7 items-center rounded-full bg-panel px-3.5 text-xs font-bold text-ink">Glyph lab</span>
          <h3 className="mt-3 text-[clamp(1.25rem,2.2vw,1.6rem)] font-bold leading-tight tracking-tight text-ink">Reshape any letter.</h3>
          <p className="mt-1.5 text-[13px] text-ink-soft">Pick a letter, drag its points, export it as PNG.</p>
        </div>

        <div className="grid gap-2.5">
          <div className="flex flex-wrap gap-[3px]" role="group" aria-label="Letters">
            {LETTERS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => pick(l)}
                aria-label={`Letter ${l}`}
                className={cn(
                  "h-[26px] w-[26px] rounded-lg text-xs font-bold transition-colors",
                  l === ch ? "bg-ink text-white" : "bg-panel text-ink-soft hover:text-ink"
                )}
              >
                {l}
              </button>
            ))}
          </div>

          {(
            [
              ["Weight", weight, 0, 24, setWeight],
              ["Width", width, 70, 130, setWidth],
              ["Slant", slant, 0, 18, setSlant],
            ] as const
          ).map(([label, value, min, max, set]) => (
            <label key={label} className="grid grid-cols-[72px_1fr] items-center gap-2.5 text-xs font-bold text-ink">
              <span className="flex justify-between">
                {label} <em className="font-medium not-italic text-ink-faint tabular-nums">{value}</em>
              </span>
              <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(e) => set(Number(e.target.value))}
                className="w-full accent-ink"
              />
            </label>
          ))}

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={exportPng} className="group/btn flex h-9 items-center gap-2.5 rounded-full bg-ink pl-4 pr-1 text-xs font-semibold text-white hover:bg-ink/85">
              Export PNG
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-ink">↓</span>
            </button>
            <button onClick={exportSvg} className="h-9 rounded-full bg-panel px-4 text-xs font-semibold text-ink ring-1 ring-inset ring-line hover:ring-ink-faint">
              SVG
            </button>
            <button onClick={reset} className="text-xs font-bold text-ink-soft underline underline-offset-4 hover:text-ink">
              Reset
            </button>
            {msg && <span className="text-xs font-semibold text-ink-soft" role="status">{msg}</span>}
          </div>
        </div>
      </div>

      <div className="lab-canvas aspect-square rounded-[26px] bg-panel p-1.5 shadow-[0_10px_26px_-16px_rgba(22,24,30,.3)]">
        <svg
          ref={svgRef}
          viewBox="0 0 440 380"
          role="img"
          aria-label={`Editable letter ${ch} with anchor points`}
          className="block h-full w-full rounded-[20px] [touch-action:none]"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
        >
          <defs>
            <pattern id="lgrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M20 0H0V20" fill="none" stroke="#ECEEF1" />
            </pattern>
          </defs>
          <rect width="440" height="380" fill="url(#lgrid)" />
          {[
            [70, "Cap height"],
            [142, "x-height"],
            [310, "Baseline"],
          ].map(([y, label]) => (
            <g key={label as string} opacity=".6">
              <line x1="0" x2="440" y1={y as number} y2={y as number} stroke="#FF2E88" strokeWidth="1.2" strokeDasharray="6 6" />
              <text x="8" y={(y as number) - 6} fontSize="12" fill="#FF2E88">{label}</text>
            </g>
          ))}
          <path ref={pathRef} d={d} fill="#16181E" stroke="#16181E" strokeWidth={weight} strokeLinejoin="miter" strokeMiterlimit={4} />
          <g>
            {cons.map((ns, c) =>
              ns.map((n, j) => {
                const A = tf(n.x, n.y);
                const I = n.i ? tf(n.i[0], n.i[1]) : null;
                const O = n.o ? tf(n.o[0], n.o[1]) : null;
                const selected = sel?.c === c && sel.n === j;
                return (
                  <g key={`${c}-${j}`} data-c={c} data-n={j} className={selected ? "lab-node-sel" : ""}>
                    {selected && I && <line className="lab-line" x1={A[0]} y1={A[1]} x2={I[0]} y2={I[1]} />}
                    {selected && O && <line className="lab-line" x1={A[0]} y1={A[1]} x2={O[0]} y2={O[1]} />}
                    {selected && I && <circle className="lab-handle" r={5} cx={I[0]} cy={I[1]} data-k="i" />}
                    {selected && O && <circle className="lab-handle" r={5} cx={O[0]} cy={O[1]} data-k="o" />}
                    <circle className="lab-hit" r={11} cx={A[0]} cy={A[1]} data-k="a" />
                    <circle className="lab-anchor" r={5.5} cx={A[0]} cy={A[1]} />
                  </g>
                );
              })
            )}
          </g>
        </svg>
      </div>
    </div>
  );
}
