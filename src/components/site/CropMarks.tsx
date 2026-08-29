import { cn } from "@/lib/utils";

/**
 * Printer's registration mark — the crosshair-in-circle used on press
 * proofs to align plates. Pulpenitem's recurring signature motif,
 * marking the corners of specimen sheets and the hero across the site.
 */
export function RegMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-4 w-4 text-ink-soft/50", className)}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="6.5" fill="none" stroke="currentColor" strokeWidth="0.75" />
      <line x1="12" y1="0" x2="12" y2="24" stroke="currentColor" strokeWidth="0.75" />
      <line x1="0" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="0.75" />
    </svg>
  );
}

/** Wraps a section in four corner registration marks, like a specimen sheet. */
export function SpecimenFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <RegMark className="absolute -left-2 -top-2" />
      <RegMark className="absolute -right-2 -top-2" />
      <RegMark className="absolute -left-2 -bottom-2" />
      <RegMark className="absolute -right-2 -bottom-2" />
      {children}
    </div>
  );
}
