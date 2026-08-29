"use client";

import Link from "next/link";
import { SavedIndicator } from "@/components/admin/Toast";
import type { SaveState } from "./useSavedAction";

export function StickyBar({
  fontName,
  saveState,
  onSaveDraft,
  onPublish,
  disabled,
  status,
}: {
  fontName: string;
  saveState: SaveState;
  onSaveDraft: () => void;
  onPublish: () => void;
  disabled?: boolean;
  status: "draft" | "published";
}) {
  return (
    <div className="sticky top-0 z-30 -mx-6 -mt-10 mb-6 border-b border-line bg-panel/95 px-6 py-3.5 backdrop-blur md:-mx-10 md:-mt-14 md:px-10">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/fonts"
          className="shrink-0 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
        >
          ← Fonts
        </Link>
        <span className="text-line">|</span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
          {fontName || "Untitled font"}
        </span>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${
            status === "published" ? "border-ink text-ink" : "border-line text-ink-soft"
          }`}
        >
          {status}
        </span>
        <SavedIndicator state={saveState} />
        <div className="ml-auto flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            disabled={disabled}
            onClick={onSaveDraft}
            className="rounded-md border border-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.04em] text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-40"
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onPublish}
            className="rounded-md border border-ink bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.04em] text-paper transition-colors hover:bg-signal-dim disabled:opacity-40"
          >
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}
