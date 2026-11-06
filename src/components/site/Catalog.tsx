"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FontWithRelations } from "@/lib/types/database";
import { FontGrid } from "@/components/site/FontGrid";
import { cn, isSaleActive } from "@/lib/utils";

const TABS = ["All", "New", "On sale", "Featured"] as const;
type Tab = (typeof TABS)[number];

const priceOf = (f: FontWithRelations) =>
  f.license_prices.length ? Math.min(...f.license_prices.map((lp) => lp.price)) : f.price;

/** Homepage catalog: filter pills, search, sort, and a text box that sets every preview. */
export function Catalog({ fonts, limit = 12 }: { fonts: FontWithRelations[]; limit?: number }) {
  const [tab, setTab] = useState<Tab>("All");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("new");
  const [text, setText] = useState("");

  const list = useMemo(() => {
    const l = fonts.filter(
      (f) =>
        (tab === "All" ||
          (tab === "New" && f.is_new) ||
          (tab === "On sale" && isSaleActive(f)) ||
          (tab === "Featured" && f.is_featured)) &&
        f.name.toLowerCase().includes(q.toLowerCase())
    );
    if (sort === "lo") l.sort((a, b) => priceOf(a) - priceOf(b));
    if (sort === "hi") l.sort((a, b) => priceOf(b) - priceOf(a));
    if (sort === "az") l.sort((a, b) => a.name.localeCompare(b.name));
    return l;
  }, [fonts, tab, q, sort]);

  const shown = list.slice(0, limit);
  const field =
    "h-10 rounded-full bg-panel px-5 text-sm text-ink ring-1 ring-inset ring-line placeholder:text-ink-faint hover:ring-ink-faint focus:outline-none focus:ring-2 focus:ring-signal";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-2.5">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "h-9 rounded-full px-4 text-[13px] font-semibold transition-colors",
                tab === t ? "bg-ink text-white" : "bg-panel text-ink-soft ring-1 ring-inset ring-line hover:text-ink hover:ring-ink-faint"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <span className="flex-1" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={40}
          placeholder="Type to preview every font"
          aria-label="Preview text"
          className={cn(field, "w-full sm:w-60")}
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          aria-label="Search fonts"
          className={cn(field, "w-full sm:w-44")}
        />
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort" className={cn(field, "pr-4")}>
          <option value="new">Newest</option>
          <option value="lo">Price: low to high</option>
          <option value="hi">Price: high to low</option>
          <option value="az">Name A–Z</option>
        </select>
      </div>

      <FontGrid fonts={shown} text={text} />

      {list.length > shown.length && (
        <div className="mt-8 flex justify-center">
          <Link
            href="/fonts"
            className="group/btn inline-flex h-12 items-center gap-3 rounded-full bg-ink pl-6 pr-1.5 text-sm font-semibold text-white hover:bg-ink/85"
          >
            See all {list.length} fonts
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink transition-transform group-hover/btn:translate-x-0.5">→</span>
          </Link>
        </div>
      )}
    </div>
  );
}
