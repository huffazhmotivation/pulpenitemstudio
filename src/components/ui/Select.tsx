import { cn } from "@/lib/utils";
import type { SelectHTMLAttributes } from "react";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full border border-line bg-paper px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:border-signal focus:ring-1 focus:ring-signal transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
