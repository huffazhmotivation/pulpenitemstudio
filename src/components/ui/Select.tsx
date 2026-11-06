import { cn } from "@/lib/utils";
import type { SelectHTMLAttributes } from "react";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-xl border border-line bg-panel px-4 py-2.5 text-sm text-ink transition-colors hover:border-ink-faint focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/25",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
