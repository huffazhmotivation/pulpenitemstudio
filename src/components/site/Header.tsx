"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CartWidget } from "@/components/site/CartWidget";
import { cn } from "@/lib/utils";
import type { SiteSettings } from "@/lib/types/database";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/fonts", label: "Fonts" },
  { href: "/about", label: "About" },
  { href: "/license", label: "License" },
  { href: "/contact", label: "Contact" },
];

function Mark() {
  return (
    <svg viewBox="0 0 34 34" aria-hidden className="h-9 w-9">
      <rect width="34" height="34" rx="11" fill="#2D6BF3" />
      <path d="M9.5 24.5l1.3-4.6L21 9.5l3.5 3.5L14.1 23.2z" fill="#fff" />
      <path d="M9.5 24.5l1.3-4.6 3.3 3.3z" fill="#FFD84D" />
    </svg>
  );
}

export function Header({ settings }: { settings: SiteSettings }) {
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);

  // Close the mobile menu on navigation and on Escape.
  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  return (
    <header className="relative mx-auto flex h-[84px] w-full max-w-grid items-center gap-3 px-4 sm:gap-5 sm:px-6 md:px-10">
      <Link href="/" className="flex items-center gap-2.5 text-[19px] font-extrabold tracking-tight text-ink">
        <Mark />
        <span className="hidden sm:inline md:hidden lg:inline">{settings.studio_name}</span>
      </Link>

      <nav aria-label="Main" className="mx-auto hidden rounded-full bg-panel p-1.5 shadow-card md:flex">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
                active ? "bg-ink text-white" : "text-ink-soft hover:text-ink"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2.5 md:ml-0">
        <button
          type="button"
          onClick={() => setMenu((m) => !m)}
          aria-label={menu ? "Close menu" : "Open menu"}
          aria-expanded={menu}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-panel text-ink shadow-card md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menu ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
        <CartWidget whatsappNumber={settings.whatsapp_number} />
        <Link
          href="/fonts"
          className="group/btn hidden h-12 items-center gap-3 rounded-full bg-ink pl-6 pr-1.5 text-sm font-semibold text-white transition-colors hover:bg-ink/85 lg:flex"
        >
          Shop fonts
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink transition-transform group-hover/btn:translate-x-0.5">→</span>
        </Link>
      </div>

      {menu && (
        <nav aria-label="Mobile" className="absolute inset-x-4 top-[78px] z-50 animate-fade-up rounded-2xl bg-panel p-2 shadow-lift sm:inset-x-6 md:hidden">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-xl px-4 py-3 text-[15px] font-semibold",
                  active ? "bg-ink text-white" : "text-ink hover:bg-paper"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
