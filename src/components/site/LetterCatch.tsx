"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadFontFace } from "@/lib/useFontFace";
import { cn } from "@/lib/utils";

/** Two colours only: ink and the brand blue. Everything else is neutral. */
const INK = "#16181E";
const BLUE = "#2D6BF3";
const COLORS = [INK, BLUE];
const DARK_TEXT = new Set<string>();

export interface GameFont {
  name: string;
  woff2Url: string;
}
const FALLBACK = ["KOPI", "BATIK", "TINTA", "PASAR", "SENJA", "WARUNG"];
const H = 300;
const TILE = 46;
const BASKET_W = 92;
const LS_KEY = "pulpenitem_catch_best";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

interface Tile { id: number; ch: string; x: number; y: number; vy: number; color: string; fam: string | null; rot: number; vr: number; ph: number }
interface Part { x: number; y: number; vx: number; vy: number; life: number; color: string; s: number }
interface Pop { x: number; y: number; life: number; text: string; color: string }

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const shuffle = <T,>(a: T[]) => {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Letter catch: colourful letters rain down, each set in one of the shop's real
 * fonts. Move the basket and catch the letters of the word in order.
 */
export function LetterCatch({ fonts }: { fonts: GameFont[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"idle" | "play" | "over">("idle");
  const [hud, setHud] = useState({ lives: 3, score: 0, level: 1, word: FALLBACK[0], idx: 0, combo: 0 });
  const [best, setBest] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [, setTick] = useState(0);
  const [visible, setVisible] = useState(true);
  const fam = useRef<Record<string, string>>({});
  const g = useRef({
    tiles: [] as Tile[],
    parts: [] as Part[],
    pops: [] as Pop[],
    bx: 200,
    tx: 200,
    w: 400,
    spawn: 0,
    id: 0,
    lives: 3,
    score: 0,
    level: 1,
    combo: 0,
    word: FALLBACK[0],
    idx: 0,
    words: [] as string[],
    wi: 0,
  });

  const words = useMemo(() => {
    const fromFonts = fonts
      .map((f) => f.name.split(" ")[0].toUpperCase().replace(/[^A-Z]/g, ""))
      .filter((w) => w.length >= 3 && w.length <= 6);
    return fromFonts.length >= 2 ? Array.from(new Set(fromFonts)) : FALLBACK;
  }, [fonts]);

  const fontOfWord = useCallback(
    (word: string) => fonts.find((f) => f.name.toUpperCase().startsWith(word))?.name ?? null,
    [fonts]
  );

  useEffect(() => {
    try {
      setBest(Number(window.localStorage.getItem(LS_KEY)) || 0);
    } catch {
      /* private mode */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fonts.forEach(async (f, i) => {
      const family = await loadFontFace(`catch-${i}`, f.woff2Url);
      if (family && !cancelled) {
        fam.current[f.name] = family;
        setTick((t) => t + 1);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fonts]);

  // Pause while the game is scrolled out of view.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.2 });
    io.observe(wrap);
    return () => io.disconnect();
  }, []);

  // Keep the canvas crisp at any width.
  useEffect(() => {
    const wrap = wrapRef.current;
    const cv = cvRef.current;
    if (!wrap || !cv) return;
    const fit = () => {
      const w = wrap.clientWidth;
      const dpr = window.devicePixelRatio || 1;
      g.current.w = w;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(H * dpr);
      cv.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.current.bx = g.current.tx = Math.min(Math.max(g.current.tx, BASKET_W / 2), w - BASKET_W / 2);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  const sync = useCallback(() => {
    const s = g.current;
    setHud({ lives: s.lives, score: s.score, level: s.level, word: s.word, idx: s.idx, combo: s.combo });
  }, []);

  const nextWord = useCallback(() => {
    const s = g.current;
    s.wi = (s.wi + 1) % s.words.length;
    s.word = s.words[s.wi];
    s.idx = 0;
  }, []);

  function start() {
    const s = g.current;
    s.tiles = [];
    s.parts = [];
    s.pops = [];
    s.lives = 3;
    s.score = 0;
    s.level = 1;
    s.combo = 0;
    s.spawn = 0.3;
    s.words = shuffle(words);
    s.wi = 0;
    s.word = s.words[0];
    s.idx = 0;
    sync();
    setPhase("play");
  }

  const burst = (x: number, y: number, color: string, n = 14) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 70 + Math.random() * 170;
      g.current.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 70, life: 0.7 + Math.random() * 0.4, color: i % 3 === 0 ? pick(COLORS) : color, s: 4 + Math.random() * 5 });
    }
  };

  // The game loop.
  useEffect(() => {
    if (phase !== "play" || !visible) return;
    const cv = cvRef.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    let raf = 0;
    let last = performance.now();
    const basketTop = H - 52;

    const spawn = () => {
      const s = g.current;
      const need = s.word[s.idx];
      const r = Math.random();
      const ch = r < 0.5 ? need : r < 0.7 ? pick([...s.word]) : pick([...ALPHABET].filter((c) => c !== need));
      const isNeed = ch === need;
      const ownFont = isNeed ? fontOfWord(s.word) : null;
      const name = ownFont ?? (fonts.length ? pick(fonts).name : null);
      s.tiles.push({
        id: ++s.id,
        ch,
        x: TILE / 2 + 6 + Math.random() * (s.w - TILE - 12),
        y: -TILE,
        vy: 95 + s.level * 16 + Math.random() * 40,
        color: pick(COLORS),
        fam: name ? fam.current[name] ?? null : null,
        rot: (Math.random() - 0.5) * 0.5,
        vr: (Math.random() - 0.5) * 1.2,
        ph: Math.random() * 6,
      });
    };

    const caught = (t: Tile) => {
      const s = g.current;
      if (t.ch === s.word[s.idx]) {
        s.idx++;
        const gain = 10 + s.combo * 3;
        s.score += gain;
        s.combo++;
        burst(t.x, basketTop, t.color);
        s.pops.push({ x: t.x, y: basketTop - 12, life: 0.9, text: `+${gain}`, color: t.color });
        if (s.idx >= s.word.length) {
          s.score += 40;
          s.level++;
          s.pops.push({ x: s.w / 2, y: H / 2, life: 1.3, text: `${s.word}! +40`, color: INK });
          burst(s.w / 2, H / 2, BLUE, 30);
          nextWord();
        }
      } else {
        s.lives--;
        s.combo = 0;
        burst(t.x, basketTop, "#98A0B3", 10);
        s.pops.push({ x: t.x, y: basketTop - 12, life: 0.8, text: "✕", color: INK });
        setShaking(true);
        window.setTimeout(() => setShaking(false), 420);
        if (s.lives <= 0) {
          setPhase("over");
          setBest((b) => {
            const nb = Math.max(b, s.score);
            try {
              window.localStorage.setItem(LS_KEY, String(nb));
            } catch {
              /* ignore */
            }
            return nb;
          });
        }
      }
      sync();
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = g.current;

      s.spawn -= dt;
      if (s.spawn <= 0) {
        spawn();
        s.spawn = Math.max(0.34, 0.8 - s.level * 0.05);
      }
      s.bx += (s.tx - s.bx) * Math.min(1, dt * 16);

      for (const t of s.tiles) {
        t.y += t.vy * dt;
        t.x += Math.sin(t.ph + t.y * 0.025) * 14 * dt;
        t.rot += t.vr * dt;
      }
      s.tiles = s.tiles.filter((t) => {
        if (t.y > basketTop - TILE * 0.4 && t.y < basketTop + 22 && Math.abs(t.x - s.bx) < BASKET_W / 2 + TILE * 0.25) {
          caught(t);
          return false;
        }
        return t.y < H + TILE;
      });
      for (const p of s.parts) {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 520 * dt;
      }
      s.parts = s.parts.filter((p) => p.life > 0);
      for (const p of s.pops) {
        p.life -= dt;
        p.y -= 34 * dt;
      }
      s.pops = s.pops.filter((p) => p.life > 0);

      // draw
      ctx.clearRect(0, 0, s.w, H);
      for (const t of s.tiles) {
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.rotate(t.rot);
        ctx.shadowColor = "rgba(22,24,30,.18)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = t.color;
        roundRect(ctx, -TILE / 2, -TILE / 2, TILE, TILE, 14);
        ctx.fill();
        ctx.shadowColor = "transparent";
        ctx.fillStyle = DARK_TEXT.has(t.color) ? "#16181E" : "#fff";
        ctx.font = t.fam ? `400 ${TILE * 0.66}px "${t.fam}", system-ui` : `800 ${TILE * 0.56}px system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(t.ch, 0, 2);
        ctx.restore();
      }
      for (const p of s.parts) {
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
      }
      ctx.globalAlpha = 1;
      // basket, showing the letter it wants next
      const need = s.word[s.idx];
      ctx.shadowColor = "rgba(22,24,30,.25)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 5;
      ctx.fillStyle = "#16181E";
      roundRect(ctx, s.bx - BASKET_W / 2, basketTop, BASKET_W, 30, 15);
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.fillStyle = BLUE;
      roundRect(ctx, s.bx - BASKET_W / 2 + 5, basketTop + 5, BASKET_W - 10, 5, 3);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "800 14px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`cari ${need}`, s.bx, basketTop + 20);
      for (const p of s.pops) {
        ctx.globalAlpha = Math.min(1, p.life * 2);
        ctx.fillStyle = p.color;
        ctx.font = "800 18px system-ui";
        ctx.fillText(p.text, p.x, p.y);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [phase, visible, fonts, fontOfWord, nextWord, sync]);

  // Keyboard control.
  useEffect(() => {
    if (phase !== "play") return;
    const onKey = (e: KeyboardEvent) => {
      const s = g.current;
      if (e.key === "ArrowLeft") s.tx = Math.max(BASKET_W / 2, s.tx - 46);
      if (e.key === "ArrowRight") s.tx = Math.min(s.w - BASKET_W / 2, s.tx + 46);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  function move(e: React.PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    g.current.tx = Math.min(Math.max(e.clientX - r.left, BASKET_W / 2), r.width - BASKET_W / 2);
  }

  const wordFam = fam.current[fontOfWord(hud.word) ?? ""] ?? null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="whitespace-nowrap text-lg tracking-wider" aria-label={`${hud.lives} nyawa`}>
          {Array.from({ length: 3 }, (_, i) => (
            <span key={i} className={cn("inline-block transition-transform", i < hud.lives ? "text-signal" : "scale-75 text-ink/15")}>♥</span>
          ))}
        </span>
        <div className="flex min-w-0 gap-[3px] sm:gap-1" aria-label={`Kata ${hud.word}`}>
          {Array.from(hud.word).map((c, i) => (
            <span
              key={`${hud.word}-${i}`}
              className={cn(
                "flex h-8 w-7 items-center justify-center rounded-lg text-base font-bold transition-all sm:h-9 sm:w-8 sm:rounded-xl sm:text-lg",
                i < hud.idx ? "pop-in text-white" : "bg-paper-dim text-ink/25"
              )}
              style={{
                background: i < hud.idx ? COLORS[i % COLORS.length] : undefined,
                color: i < hud.idx && DARK_TEXT.has(COLORS[i % COLORS.length]) ? "#16181E" : undefined,
                fontFamily: wordFam ? `"${wordFam}", system-ui` : undefined,
              }}
            >
              {c}
            </span>
          ))}
        </div>
        <span className="min-w-[3.5rem] text-right text-sm font-extrabold tabular-nums">
          {hud.score}
          {hud.combo > 1 && <span key={hud.combo} className="pop-in ml-1.5 rounded-full bg-signal px-2 py-0.5 text-[10px] text-white">x{hud.combo}</span>}
        </span>
      </div>

      <div
        ref={wrapRef}
        onPointerMove={move}
        onPointerDown={move}
        className={cn("relative select-none overflow-hidden rounded-2xl", shaking && "shake")}
        style={{ height: H, background: "linear-gradient(160deg,#FAFBFC,#ECEEF2)", cursor: phase === "play" ? "ew-resize" : "default", touchAction: phase === "play" ? "none" : "pan-y" }}
      >
        <canvas ref={cvRef} className="block h-full w-full" aria-label="Letter catch game area" />

        {phase === "idle" && (
          <div className="pop-in absolute inset-0 grid place-content-center justify-items-center gap-2.5 bg-white/55 px-6 text-center backdrop-blur-[2px]">
            <div className="flex gap-1 sm:gap-1.5">
              {["T", "A", "N", "G", "K", "A", "P"].map((c, i) => (
                <span key={i} className="flex h-8 w-7 items-center justify-center rounded-lg text-base font-extrabold sm:h-9 sm:w-8 sm:rounded-xl sm:text-lg" style={{ background: COLORS[i % COLORS.length], color: DARK_TEXT.has(COLORS[i % COLORS.length]) ? "#16181E" : "#fff", transform: `rotate(${(i % 2 ? 1 : -1) * 4}deg)` }}>{c}</span>
              ))}
            </div>
            <p className="max-w-[26ch] text-[13px] font-semibold text-ink-soft">Geser keranjang (mouse, jari, atau tombol ← →) dan tangkap huruf sesuai urutan kata.</p>
            <button onClick={start} className="mt-1 h-11 rounded-full bg-ink px-7 text-sm font-semibold text-white hover:bg-ink/85">Main sekarang</button>
            {best > 0 && <p className="text-xs font-bold text-ink-faint">Rekor kamu: {best}</p>}
          </div>
        )}

        {phase === "over" && (
          <div className="pop-in absolute inset-0 grid place-content-center justify-items-center gap-2 bg-white/70 px-6 text-center backdrop-blur-[3px]">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">Game over</p>
            <p className="text-5xl font-extrabold tracking-[-0.04em]">{hud.score}</p>
            <p className="text-[13px] font-semibold text-ink-soft">
              {hud.score >= best && hud.score > 0 ? "Rekor baru! Tangan kamu cepat." : `Rekor kamu: ${best} · level ${hud.level}`}
            </p>
            <button onClick={start} className="mt-1 h-11 rounded-full bg-ink px-7 text-sm font-semibold text-white hover:bg-ink/85">Main lagi</button>
          </div>
        )}
      </div>
    </div>
  );
}
