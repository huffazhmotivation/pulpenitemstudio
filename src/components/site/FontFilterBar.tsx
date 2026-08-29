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
          className="w-full rounded-md border border-line bg-panel px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink"
        />
      </form>

      <div className="flex flex-wrap gap-2 text-sm">
        <button
          onClick={() => pushParams({ category: null })}
          className={cn(
            "rounded-full border px-3.5 py-1.5 font-medium transition-colors",
            !activeCategory ? "border-ink bg-ink text-paper" : "border-line text-ink-soft hover:border-ink"
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => pushParams({ category: cat.slug })}
            className={cn(
              "rounded-full border px-3.5 py-1.5 font-medium transition-colors",
              activeCategory === cat.slug
                ? "border-ink bg-ink text-paper"
                : "border-line text-ink-soft hover:border-ink"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
