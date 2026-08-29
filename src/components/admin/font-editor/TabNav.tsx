"use client";

import { cn } from "@/lib/utils";

export interface TabDef {
  id: string;
  label: string;
  locked?: boolean;
}

export function TabNav({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((tab, i) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            disabled={tab.locked}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative shrink-0 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors",
              isActive ? "text-ink" : "text-ink-soft hover:text-ink",
              tab.locked && "cursor-not-allowed text-ink-faint hover:text-ink-faint"
            )}
          >
            <span className="flex items-center gap-1.5">
              <span className="text-xs text-ink-faint">{i + 1}.</span>
              {tab.label}
              {tab.locked && (
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" className="text-ink-faint">
                  <rect x="3.5" y="7" width="9" height="6.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              )}
            </span>
            {isActive && <span className="absolute inset-x-0 -bottom-px h-[2px] bg-ink" />}
          </button>
        );
      })}
    </div>
  );
}
