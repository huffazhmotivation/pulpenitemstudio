import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";

const base =
  "group/btn inline-flex items-center justify-center gap-3 rounded-full text-sm font-semibold tracking-tight transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98]";

const variants = {
  primary: "bg-ink text-white hover:bg-ink/85",
  secondary: "bg-panel text-ink ring-1 ring-inset ring-line hover:ring-ink-faint",
  ghost: "bg-transparent text-ink hover:bg-ink/5",
  signal: "bg-signal text-white hover:bg-signal-dim shadow-[0_10px_24px_-10px_rgba(45,107,243,.7)]",
};

const sizes = {
  sm: "h-9 px-4 text-xs",
  md: "h-11 px-6",
  lg: "h-12 px-7 text-[15px]",
};

interface CommonProps {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
  /** Show the circular arrow chip on the right. */
  arrow?: boolean;
}

function Arrow({ variant }: { variant: keyof typeof variants }) {
  return (
    <span
      aria-hidden
      className={cn(
        "-mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm transition-transform duration-200 group-hover/btn:translate-x-0.5",
        variant === "primary" ? "bg-white text-ink" : variant === "signal" ? "bg-white text-signal" : "bg-ink text-white"
      )}
    >
      →
    </span>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  arrow = false,
  className,
  children,
  ...props
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children as ReactNode}
      {arrow && <Arrow variant={variant} />}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  arrow = false,
  className,
  href,
  children,
  ...props
}: CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const cls = cn(base, variants[variant], sizes[size], className);
  const isExternal = href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:");
  const inner = (
    <>
      {children}
      {arrow && <Arrow variant={variant} />}
    </>
  );
  if (isExternal) {
    return (
      <a href={href} className={cls} {...props}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...(props as object)}>
      {inner}
    </Link>
  );
}
