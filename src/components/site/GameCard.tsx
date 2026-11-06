"use client";

import { LetterCatch, type GameFont } from "@/components/site/LetterCatch";

/** The footer's one mini game. A white card so it sits cleanly on the dark panel. */
export function GameCard({ fonts }: { fonts: GameFont[] }) {
  return (
    <div className="rounded-[28px] bg-panel p-5 text-ink shadow-lift">
      <div className="mb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">Mini game</p>
        <p className="text-lg font-extrabold tracking-tight">Tangkap huruf</p>
      </div>
      <LetterCatch fonts={fonts} />
    </div>
  );
}
