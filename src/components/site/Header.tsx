import Image from "next/image";
import Link from "next/link";
import { CartWidget } from "@/components/site/CartWidget";
import type { SiteSettings } from "@/lib/types/database";

const NAV = [
  { href: "/fonts", label: "Fonts" },
  { href: "/about", label: "About" },
  { href: "/license", label: "License" },
  { href: "/contact", label: "Contact" },
];

export function Header({ settings }: { settings: SiteSettings }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-paper/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-grid flex-wrap items-center justify-between gap-4 px-6 py-4 md:px-10">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/logo-pulpenitem.png"
            alt={settings.studio_name}
            width={1126}
            height={147}
            priority
            className="h-7 w-auto md:h-8"
          />
        </Link>
        <nav className="order-3 flex w-full items-center gap-6 text-sm font-medium text-ink-soft sm:order-none sm:w-auto sm:gap-7">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-signal">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <CartWidget whatsappNumber={settings.whatsapp_number} />
          <Link
            href="/fonts"
            className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-signal-dim"
          >
            Shop fonts
          </Link>
        </div>
      </div>
    </header>
  );
}
