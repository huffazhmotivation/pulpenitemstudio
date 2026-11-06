"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types/database";

export function FontFilterBar({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const activeCategory = searchParams.get("category");
  const saleOnly = searchParams.get("sale");

  function pushParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  const pill = (active: boolean) =>
    cn(
      "h-9 rounded-full px-4 text-[13px] font-semibold transition-colors",
      active ? "bg-ink text-white" : "bg-panel text-ink-soft ring-1 ring-inset ring-line hover:text-ink hover:ring-ink-faint"
    );

  return (
    <div className={cn("space-y-4", isPending && "opacity-70")}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          pushParams({ q: query || null });
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search fonts by name, tag, or keyword…"
          className="h-12 w-full rounded-full bg-panel px-6 text-sm text-ink ring-1 ring-inset ring-line placeholder:text-ink-faint hover:ring-ink-faint focus:outline-none focus:ring-2 focus:ring-signal"
        />
      </form>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => pushParams({ category: null, sale: null })} className={pill(!activeCategory && !saleOnly)}>
          All
        </button>
        <button onClick={() => pushParams({ sale: saleOnly ? null : "1" })} className={pill(!!saleOnly)}>
          On sale
        </button>
        {categories.map((cat) => (
          <button key={cat.id} onClick={() => pushParams({ category: cat.slug })} className={pill(activeCategory === cat.slug)}>
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
