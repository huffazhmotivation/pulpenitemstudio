"use client";

import Link from "next/link";
import { useFontFace } from "@/lib/useFontFace";
import { cn } from "@/lib/utils";

export interface StyleTile {
  slug: string;
  name: string;
  count: number;
  fontName: string | null;
  woff2Url: string | null;
}

const TONES = [
  "bg-[linear-gradient(140deg,#E3E5EA,#F5F6F8)] text-ink",
  "bg-yellow text-ink",
  "bg-[linear-gradient(140deg,#FF8FBE,#FFD0E0)] text-[#3A0A1F]",
  "bg-ink text-white",
  "bg-[#BDF0D8] text-[#0B3B2A]",
  "bg-[#ECE6FF] text-[#2A1A66]",
];
const SAMPLES = ["Aa", "Ag", "Rr", "Ab", "01", "Qk"];

function Tile({ tile, i }: { tile: StyleTile; i: number }) {
  const { family, ref } = useFontFace<HTMLAnchorElement>(`style-${tile.slug}`, tile.woff2Url);
  const big = i === 0;
  return (
    <Link
      ref={ref}
      href={`/fonts?category=${tile.slug}`}
      className={cn(
        "group relative flex min-h-[200px] min-w-0 flex-col justify-between overflow-hidden rounded-[36px] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift",
        TONES[i % TONES.length],
        big && "sm:col-span-2 sm:row-span-2"
      )}
    >
      <span className="pointer-events-none absolute -bottom-1/4 -right-1/5 aspect-square w-[70%] rounded-full bg-white/40 blur-2xl" aria-hidden />
      <span className="relative flex items-center justify-between gap-2">
        <span className="text-[13px] font-extrabold uppercase tracking-[0.04em]">{tile.name}</span>
        <span className="rounded-full bg-white/30 px-2.5 py-1 text-xs font-bold">
          {tile.count} {tile.count === 1 ? "family" : "families"}
        </span>
      </span>
      <span
        className={cn("relative block leading-none", big ? "text-[clamp(8rem,17vw,13rem)]" : "text-[5.5rem]")}
        style={{ fontFamily: family ? `"${family}", system-ui` : "system-ui", letterSpacing: "-0.02em" }}
      >
        {SAMPLES[i % SAMPLES.length]}
      </span>
      <span className="relative flex items-center justify-between gap-2 text-sm font-bold">
        <span className="truncate">{tile.fontName ?? "Coming soon"}</span>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-ink transition-transform duration-300 group-hover:rotate-45">↗</span>
      </span>
    </Link>
  );
}

export function StyleBento({ tiles }: { tiles: StyleTile[] }) {
  if (tiles.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 sm:auto-rows-[minmax(210px,auto)]">
      {tiles.slice(0, 5).map((t, i) => (
        <Tile key={t.slug} tile={t} i={i} />
      ))}
    </div>
  );
}
