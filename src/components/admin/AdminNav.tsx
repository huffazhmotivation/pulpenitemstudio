"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";
import { RegMark } from "@/components/site/CropMarks";

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
    <aside className="flex w-full shrink-0 flex-col border-b border-line bg-panel md:sticky md:top-0 md:h-screen md:w-60 md:border-b-0 md:border-r">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <RegMark className="h-4 w-4 text-signal" />
        <div>
          <Link href="/admin" className="font-display text-lg leading-none text-ink">
            Pulpenitem
          </Link>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">Studio admin</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {LINKS.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-sm px-3 py-2 text-sm transition-colors",
                active ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper-dim hover:text-ink"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line px-6 py-5">
        {email && <p className="mb-3 truncate text-xs text-ink-soft">{email}</p>}
        <div className="flex flex-col gap-2">
          <Link href="/" className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft hover:text-signal">
            ← View site
          </Link>
          <form action={signOut}>
            <button type="submit" className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft hover:text-signal">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
