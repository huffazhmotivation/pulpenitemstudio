import { cn } from "@/lib/utils";

/**
 * A run of registration swatches, like the colour/greyscale bar printed
 * along the edge of a press proof to check ink density and alignment.
 * Used as a quiet section divider throughout the site — the studio's
 * signature motif, extended from the corner registration marks.
 */
export function ColorBar({ className }: { className?: string }) {
  const swatches = [
    "bg-ink",
    "bg-signal",
    "bg-ink-soft",
    "bg-kraft",
    "bg-line",
    "bg-paper-dim",
  ];
  return (
    <div className={cn("flex h-2 w-full overflow-hidden border-y border-line", className)} aria-hidden="true">
      {swatches.map((c, i) => (
        <div key={i} className={cn("h-full flex-1", c)} />
      ))}
    </div>
  );
}
