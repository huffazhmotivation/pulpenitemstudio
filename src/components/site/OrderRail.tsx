"use client";

import { useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { StampBadge } from "@/components/ui/Badge";
import { buildEmailLink, buildWhatsAppLink, type OrderLine } from "@/lib/order-links";
import { cn, formatPrice } from "@/lib/utils";
import { useCart } from "@/lib/cart/CartContext";
import type { License, LicensePrice } from "@/lib/types/database";

interface OrderRailProps {
  fontName: string;
  fontSlug: string;
  category: string;
  styleCount: number;
  isNew: boolean;
  discount: number;
  currency: string;
  licensePrices: (LicensePrice & { license: License })[];
  whatsappNumber: string | null;
  contactEmail: string | null;
}

const Check = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);

/**
 * Two separate cards that share one selection: the order panel (license,
 * price, buy) and a "what you get" panel that lists the terms of whichever
 * licenses are ticked.
 */
export function OrderRail({
  fontName,
  fontSlug,
  category,
  styleCount,
  isNew,
  discount,
  currency,
  licensePrices,
  whatsappNumber,
  contactEmail,
}: OrderRailProps) {
  const { addItems } = useCart();
  const sorted = useMemo(
    () => [...licensePrices].sort((a, b) => a.license.sort_order - b.license.sort_order),
    [licensePrices]
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(sorted[0] ? [sorted[0].license_id] : []);
  const [justAdded, setJustAdded] = useState(false);

  const siteUrl = typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL;
  const selected = sorted.filter((lp) => selectedIds.includes(lp.license_id));
  const total = selected.reduce((sum, lp) => sum + lp.price, 0);
  const orderLines: OrderLine[] = selected.map((lp) => ({
    fontName,
    fontSlug,
    licenseName: lp.license.name,
    price: lp.price,
    currency,
  }));

  function toggleLicense(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setJustAdded(false);
  }

  function handleAddToCart() {
    if (selected.length === 0) return;
    addItems(
      selected.map((lp) => ({
        id: `${fontSlug}:${lp.license_id}`,
        fontName,
        fontSlug,
        licenseId: lp.license_id,
        licenseName: lp.license.name,
        price: lp.price,
        currency,
      }))
    );
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 2000);
  }

  return (
    <aside className="grid gap-4 lg:sticky lg:top-6 lg:self-start" aria-label="Order and license details">
      <div className="grid gap-5 rounded-2xl bg-panel p-6 shadow-card">
        <div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            <StampBadge variant="default">{category}</StampBadge>
            {isNew && <StampBadge variant="new">New</StampBadge>}
            {discount > 0 && <StampBadge variant="sale">−{discount}%</StampBadge>}
          </div>
          <h2 className="text-[1.9rem] font-extrabold leading-[1.05] tracking-[-0.035em] text-ink">{fontName}</h2>
          <p className="mt-1.5 text-[13px] text-ink-soft">
            {styleCount} style{styleCount === 1 ? "" : "s"}
          </p>
        </div>

        {sorted.length === 0 ? (
          <p className="text-sm text-ink-soft">Licensing details coming soon. Get in touch to order.</p>
        ) : (
          <>
            <div>
              <p className="eyebrow mb-2.5">License</p>
              <ul className="grid grid-cols-2 gap-2">
                {sorted.map((lp) => {
                  const checked = selectedIds.includes(lp.license_id);
                  return (
                    <li key={lp.id}>
                      <label
                        className={cn(
                          "flex h-full cursor-pointer flex-col gap-0.5 rounded-xl px-3.5 py-3 transition-colors",
                          checked ? "bg-ink text-white" : "ring-1 ring-inset ring-line hover:ring-ink-faint"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleLicense(lp.license_id)}
                          className="sr-only"
                        />
                        <span className="text-sm font-bold">{lp.license.name}</span>
                        <span className={cn("text-xs", checked ? "text-white/70" : "text-ink-soft")}>{formatPrice(lp.price, currency)}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-sm text-ink-soft">{selected.length > 1 ? `Total (${selected.length} licenses)` : "Price"}</span>
              <span className="text-[1.7rem] font-extrabold tracking-tight text-ink">
                {selected.length > 0 ? formatPrice(total, currency) : "—"}
              </span>
            </div>

            <div className="grid gap-2.5">
              <Button variant="signal" arrow disabled={selected.length === 0} onClick={handleAddToCart} className="w-full justify-between">
                {justAdded ? "Added to cart ✓" : "Add to cart"}
              </Button>
              {whatsappNumber && (
                <ButtonLink
                  href={selected.length > 0 ? buildWhatsAppLink(whatsappNumber, orderLines, { siteUrl }) : "#"}
                  variant="secondary"
                  className={cn("w-full text-[#128C4A] ring-[#25D366]", selected.length === 0 && "pointer-events-none opacity-40")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Order via WhatsApp
                </ButtonLink>
              )}
              {contactEmail && (
                <ButtonLink
                  href={selected.length > 0 ? buildEmailLink(contactEmail, orderLines, { siteUrl }) : "#"}
                  variant="ghost"
                  className={cn("w-full", selected.length === 0 && "pointer-events-none opacity-40")}
                >
                  Order via email
                </ButtonLink>
              )}
            </div>
            {!whatsappNumber && !contactEmail && (
              <p className="text-xs text-ink-soft">Ordering channels aren&apos;t configured yet. Set them in Admin → Settings.</p>
            )}
            <p className="text-xs text-ink-faint">Files are sent after payment is confirmed.</p>
          </>
        )}
      </div>

      {sorted.length > 0 && (
        <div className="rounded-2xl bg-panel p-6 shadow-card">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="eyebrow">What you get</p>
            <span className="rounded-full bg-paper-dim px-2.5 py-0.5 text-[11px] font-bold text-ink">
              {selected.length === 0 ? "None selected" : selected.map((s) => s.license.name).join(" + ")}
            </span>
          </div>
          {selected.length === 0 ? (
            <p className="text-sm text-ink-soft">Select a license above to see what it includes.</p>
          ) : (
            <ul className="divide-y divide-line">
              {selected.map((lp) => (
                <li key={lp.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#DDF5EC] text-[#12805C]">
                    <Check />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-ink">{lp.license.name}</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-ink-soft">
                      {lp.license.description || "Details on request. Reach out via WhatsApp or email."}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <a href="/license" className="mt-4 inline-block text-[13px] font-semibold text-ink underline underline-offset-4">
            Full license terms
          </a>
        </div>
      )}
    </aside>
  );
}
