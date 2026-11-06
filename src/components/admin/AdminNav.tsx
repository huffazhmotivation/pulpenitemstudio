"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";

const LINKS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/fonts", label: "Fonts" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/licenses", label: "Licenses" },
  { href: "/admin/homepage", label: "Homepage" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav({ email }: { email: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-col gap-6 rounded-2xl bg-panel p-4 shadow-card md:sticky md:top-5 md:h-[calc(100vh-40px)] md:w-60 md:py-6">
      <div className="flex items-center gap-2.5 px-2">
        <svg viewBox="0 0 34 34" aria-hidden className="h-9 w-9 shrink-0">
          <rect width="34" height="34" rx="11" fill="#2D6BF3" />
          <path d="M9.5 24.5l1.3-4.6L21 9.5l3.5 3.5L14.1 23.2z" fill="#fff" />
          <path d="M9.5 24.5l1.3-4.6 3.3 3.3z" fill="#FFD84D" />
        </svg>
        <div>
          <Link href="/admin" className="text-[17px] font-extrabold leading-none tracking-tight text-ink">
            Pulpenitem
          </Link>
          <p className="mt-1 text-[11px] font-semibold text-ink-faint">Studio admin</p>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto md:flex-1 md:flex-col md:overflow-visible">
        {LINKS.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
                active ? "bg-ink text-white" : "text-ink-soft hover:bg-paper hover:text-ink"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-xl bg-paper p-4 text-xs leading-relaxed text-ink-soft">
        {email && <p className="mb-2 truncate font-semibold text-ink">{email}</p>}
        <div className="flex flex-col gap-1.5">
          <Link href="/" className="underline underline-offset-4 hover:text-ink">
            View site
          </Link>
          <form action={signOut}>
            <button type="submit" className="underline underline-offset-4 hover:text-ink">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
