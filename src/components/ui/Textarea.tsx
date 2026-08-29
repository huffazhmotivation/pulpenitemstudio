import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-signal focus:ring-1 focus:ring-signal transition-colors",
        className
      )}
      {...props}
    />
  );
}
