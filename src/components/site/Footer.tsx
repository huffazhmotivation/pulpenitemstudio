import Link from "next/link";
import { GameCard } from "@/components/site/GameCard";
import type { GameFont } from "@/components/site/LetterCatch";
import type { SiteSettings } from "@/lib/types/database";

export function Footer({ settings, gameFonts }: { settings: SiteSettings; gameFonts: GameFont[] }) {
  const wa = settings.whatsapp_number ? `https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, "")}` : null;
  return (
    <footer className="mx-auto w-full max-w-grid px-4 pb-6 pt-20 sm:px-6 md:px-10">
      <div className="grid gap-10 lg:gap-12 rounded-[40px] bg-ink p-7 text-white sm:p-12 lg:grid-cols-[minmax(0,.75fr)_minmax(0,1.25fr)] lg:items-center">
        <div>
          <h2 className="max-w-[16ch] text-balance text-[clamp(1.8rem,3.6vw,2.8rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">
            Need something drawn for your brand?
          </h2>
          <p className="mt-4 max-w-[44ch] text-[15px] text-white/65">
            {settings.studio_tagline ?? "An independent type foundry."} Tell us what you are making and we will reply with options.
          </p>
          <div className="mt-7 flex flex-wrap gap-2.5">
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn inline-flex h-12 items-center gap-3 rounded-full bg-white pl-6 pr-1.5 text-sm font-semibold text-ink hover:bg-white/90"
              >
                Chat on WhatsApp
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white transition-transform group-hover/btn:translate-x-0.5">→</span>
              </a>
            )}
            <Link href="/contact" className="inline-flex h-12 items-center rounded-full px-6 text-sm font-semibold text-white ring-1 ring-inset ring-white/35 hover:bg-white/10">
              Contact
            </Link>
          </div>

          <nav className="mt-10 flex flex-wrap gap-x-7 gap-y-2 text-sm text-white/65" aria-label="Footer">
            <Link href="/fonts" className="hover:text-white">All fonts</Link>
            <Link href="/license" className="hover:text-white">License</Link>
            <Link href="/about" className="hover:text-white">About</Link>
            {settings.contact_email && (
              <a href={`mailto:${settings.contact_email}`} className="hover:text-white">{settings.contact_email}</a>
            )}
            {settings.instagram_handle && (
              <a href={`https://instagram.com/${settings.instagram_handle}`} className="hover:text-white">@{settings.instagram_handle}</a>
            )}
          </nav>
        </div>

        <GameCard fonts={gameFonts} />
      </div>

      <p className="py-6 text-center text-[13px] text-ink-faint">
        {settings.footer_note ?? `© ${new Date().getFullYear()} ${settings.studio_name}. All rights reserved.`}
      </p>
    </footer>
  );
}
