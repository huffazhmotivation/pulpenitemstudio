import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-line px-2.5 py-1 text-[11px] font-medium text-ink-soft",
        className
      )}
      {...props}
    />
  );
}

type StampVariant = "new" | "sale" | "featured" | "default";

const stampStyles: Record<StampVariant, string> = {
  new: "bg-ink text-paper",
  featured: "bg-signal text-paper shadow-[0_0_14px_-2px_rgba(163,230,53,0.65)]",
  sale: "bg-sale text-white",
  default: "bg-paper text-ink border border-line",
};

/** Small solid pill badge used on product cards and detail pages (NEW / SALE / FEATURED). */
export function StampBadge({
  variant = "default",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: StampVariant }) {
  return (
    <span className={cn("pill shadow-sm", stampStyles[variant], className)} {...props} />
  );
}
