"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Panel card used to group a section of fields within a tab. */
export function Card({
  title,
  description,
  children,
  className,
  action,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl bg-panel p-6 shadow-card", className)}>
      {(title || action) && (
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-line pb-4">
          <div>
            {title && <p className="text-base font-semibold text-ink">{title}</p>}
            {description && <p className="mt-1 text-xs text-ink-soft">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function FieldRow({ children, cols = 2 }: { children: ReactNode; cols?: 1 | 2 | 3 }) {
  const grid = cols === 3 ? "sm:grid-cols-3" : cols === 1 ? "sm:grid-cols-1" : "sm:grid-cols-2";
  return <div className={cn("grid grid-cols-1 gap-5", grid)}>{children}</div>;
}

export function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint"
    >
      {children}
    </label>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  id?: string;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-3 text-sm text-ink">
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-signal" : "bg-line"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          )}
        />
      </button>
      {label}
    </label>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-line bg-paper/60 px-4 py-8 text-center text-xs text-ink-soft">
      {children}
    </p>
  );
}

export const dashedUpload =
  "w-full cursor-pointer rounded-md border border-dashed border-line bg-paper px-3 py-2.5 text-xs text-ink-soft file:mr-3 file:cursor-pointer file:rounded-sm file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-[11px] file:font-semibold file:uppercase file:tracking-[0.04em] file:text-paper hover:border-ink transition-colors disabled:cursor-not-allowed disabled:opacity-40";
