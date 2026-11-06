import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-paper-dim px-3 py-1 text-[11px] font-bold text-ink",
        className
      )}
      {...props}
    />
  );
}

type StampVariant = "new" | "sale" | "featured" | "default";

const stampStyles: Record<StampVariant, string> = {
  new: "bg-ink text-white",
  featured: "bg-signal text-white",
  sale: "bg-yellow text-ink",
  default: "bg-panel text-ink ring-1 ring-inset ring-line",
};

/** Small solid pill badge used on product cards and detail pages (NEW / SALE / FEATURED). */
export function StampBadge({
  variant = "default",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: StampVariant }) {
  return <span className={cn("pill", stampStyles[variant], className)} {...props} />;
}
