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
    <div className="mb-6 flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-panel p-1.5 shadow-card">
      {tabs.map((tab, i) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            disabled={tab.locked}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              isActive ? "bg-ink text-white" : "text-ink-soft hover:text-ink",
              tab.locked && "cursor-not-allowed text-ink-faint hover:text-ink-faint"
            )}
          >
            <span className="flex items-center gap-1.5">
              <span className={isActive ? "text-xs text-white/60" : "text-xs text-ink-faint"}>{i + 1}</span>
              {tab.label}
              {tab.locked && (
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" className="text-ink-faint">
                  <rect x="3.5" y="7" width="9" height="6.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
