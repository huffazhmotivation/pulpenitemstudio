import Link from "next/link";
import type { SiteSettings } from "@/lib/types/database";

export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="border-t border-line bg-paper-dim">
      <div className="mx-auto max-w-grid px-6 py-14 md:px-10">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="font-display text-lg font-bold tracking-tight text-ink">
              {settings.studio_name}
            </Link>
            <p className="mt-3 max-w-xs text-sm text-ink-soft">{settings.studio_tagline}</p>
          </div>
          <div>
            <p className="eyebrow mb-3">Shop</p>
            <ul className="space-y-2 text-sm text-ink-soft">
              <li><Link href="/fonts" className="hover:text-ink">All fonts</Link></li>
              <li><Link href="/fonts?category=" className="hover:text-ink">Categories</Link></li>
              <li><Link href="/license" className="hover:text-ink">License</Link></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-3">Studio</p>
            <ul className="space-y-2 text-sm text-ink-soft">
              <li><Link href="/about" className="hover:text-ink">About</Link></li>
              <li><Link href="/contact" className="hover:text-ink">Contact</Link></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-3">Contact</p>
            <ul className="space-y-2 text-sm text-ink-soft">
              {settings.contact_email && (
                <li><a href={`mailto:${settings.contact_email}`} className="hover:text-ink">{settings.contact_email}</a></li>
              )}
              {settings.whatsapp_number && (
                <li><a href={`https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, "")}`} className="hover:text-ink">WhatsApp</a></li>
              )}
              {settings.instagram_handle && (
                <li><a href={`https://instagram.com/${settings.instagram_handle}`} className="hover:text-ink">@{settings.instagram_handle}</a></li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col-reverse gap-3 border-t border-line pt-6 text-xs text-ink-soft md:flex-row md:items-center md:justify-between">
          <p>{settings.footer_note ?? `© ${new Date().getFullYear()} ${settings.studio_name}. All rights reserved.`}</p>
        </div>
      </div>
    </footer>
  );
}
