import { cn } from "@/lib/utils";
import type { LabelHTMLAttributes } from "react";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "eyebrow block mb-1.5",
        className
      )}
      {...props}
    />
  );
}
