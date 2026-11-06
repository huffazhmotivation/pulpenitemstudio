import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-line bg-panel px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors hover:border-ink-faint focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/25",
        className
      )}
      {...props}
    />
  );
}
