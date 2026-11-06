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
    <div className="sticky top-0 z-30 mb-6 rounded-2xl bg-panel/95 px-5 py-3 shadow-card backdrop-blur">
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
          className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${
            status === "published" ? "bg-[#DDF5EC] text-[#12805C]" : "bg-paper-dim text-ink-soft"
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
            className="rounded-full px-5 py-2.5 text-xs font-semibold text-ink ring-1 ring-inset ring-line transition-colors hover:ring-ink-faint disabled:opacity-40"
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onPublish}
            className="rounded-full bg-ink px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-ink/85 disabled:opacity-40"
          >
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}
