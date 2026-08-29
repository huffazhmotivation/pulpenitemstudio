import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";

const base =
  "pen-btn inline-flex items-center justify-center gap-2 rounded-md border text-sm font-semibold tracking-tight disabled:opacity-40 disabled:pointer-events-none";

const variants = {
  primary: "bg-ink text-paper border-ink hover:bg-signal hover:border-signal hover:shadow-[0_0_24px_-6px_rgba(163,230,53,0.6)]",
  secondary: "bg-transparent text-ink border-ink hover:bg-signal hover:border-signal hover:text-paper hover:shadow-[0_0_24px_-6px_rgba(163,230,53,0.6)]",
  ghost: "bg-transparent text-ink border-transparent hover:border-line hover:text-signal",
  signal: "bg-signal text-paper border-signal shadow-[0_0_20px_-6px_rgba(163,230,53,0.55)] hover:bg-signal-dim hover:border-signal-dim hover:shadow-[0_0_28px_-4px_rgba(163,230,53,0.75)]",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5",
  lg: "px-7 py-3.5 text-base",
};

interface CommonProps {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  href,
  ...props
}: CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const isExternal = href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:");
  if (isExternal) {
    return (
      <a
        href={href}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], sizes[size], className)}
      {...(props as any)}
    />
  );
}
