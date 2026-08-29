"use client";

import { useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { buildEmailLink, buildWhatsAppLink, type OrderLine } from "@/lib/order-links";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/lib/cart/CartContext";
import type { License, LicensePrice } from "@/lib/types/database";

interface OrderButtonsProps {
  fontName: string;
  fontSlug: string;
  currency: string;
  licensePrices: (LicensePrice & { license: License })[];
  whatsappNumber: string | null;
  contactEmail: string | null;
}

export function OrderButtons({
  fontName,
  fontSlug,
  currency,
  licensePrices,
  whatsappNumber,
  contactEmail,
}: OrderButtonsProps) {
  const { addItems } = useCart();
  const sorted = useMemo(
    () => [...licensePrices].sort((a, b) => a.license.sort_order - b.license.sort_order),
    [licensePrices]
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(
    sorted[0] ? [sorted[0].license_id] : []
  );
  const [justAdded, setJustAdded] = useState(false);

  const siteUrl =
    typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL;

  const selected = sorted.filter((lp) => selectedIds.includes(lp.license_id));

  if (sorted.length === 0) {
    return <p className="text-sm text-ink-soft">Licensing details coming soon — get in touch to order.</p>;
  }

  function toggleLicense(licenseId: string) {
    setSelectedIds((prev) =>
      prev.includes(licenseId) ? prev.filter((id) => id !== licenseId) : [...prev, licenseId]
    );
    setJustAdded(false);
  }

  const orderLines: OrderLine[] = selected.map((lp) => ({
    fontName,
    fontSlug,
    licenseName: lp.license.name,
    price: lp.price,
    currency,
  }));

  const total = selected.reduce((sum, lp) => sum + lp.price, 0);

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
    <div className="glass-panel-signal space-y-4 bg-panel/60 p-5">
      <div>
        <Label>License</Label>
        <ul className="space-y-2">
          {sorted.map((lp) => {
            const checked = selectedIds.includes(lp.license_id);
            return (
              <li key={lp.id}>
                <label
                  className={`flex cursor-pointer items-center gap-2.5 rounded-md border p-2.5 transition-colors ${
                    checked ? "border-signal bg-paper" : "border-line hover:bg-paper"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleLicense(lp.license_id)}
                    className="accent-signal"
                  />
                  <span className="flex flex-1 items-baseline justify-between gap-2 text-sm text-ink">
                    <span className="font-medium">{lp.license.name}</span>
                    <span className="shrink-0 font-mono text-xs text-ink-soft">{formatPrice(lp.price, currency)}</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      {/* License terms — always visible, synced to whichever licenses are checked above */}
      <div className="space-y-3 rounded-md border border-line bg-paper p-3.5">
        <p className="eyebrow">License terms</p>
        {selected.length === 0 ? (
          <p className="text-xs text-ink-soft">Select a license above to see its usage terms.</p>
        ) : (
          <ul className="space-y-3">
            {selected.map((lp) => (
              <li key={lp.id}>
                <p className="text-xs font-semibold text-ink">{lp.license.name}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                  {lp.license.description || "Details available on request — reach out via WhatsApp or email."}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="w-full"
        disabled={selected.length === 0}
        onClick={handleAddToCart}
      >
        {justAdded ? "Added to cart ✓" : "Add to cart"}
      </Button>

      <div className="flex items-baseline justify-between border-t border-line pt-4">
        <span className="eyebrow">
          {selected.length > 1 ? `Total (${selected.length} licenses)` : "Price"}
        </span>
        <span className="font-mono text-2xl font-semibold text-ink">
          {selected.length > 0 ? formatPrice(total, currency) : "—"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {whatsappNumber && (
          <ButtonLink
            href={
              selected.length > 0
                ? buildWhatsAppLink(whatsappNumber, orderLines, { siteUrl })
                : "#"
            }
            variant="signal"
            className={`w-full ${selected.length === 0 ? "pointer-events-none opacity-40" : ""}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Order via WhatsApp
          </ButtonLink>
        )}
        {contactEmail && (
          <ButtonLink
            href={
              selected.length > 0 ? buildEmailLink(contactEmail, orderLines, { siteUrl }) : "#"
            }
            variant="secondary"
            className={`w-full ${selected.length === 0 ? "pointer-events-none opacity-40" : ""}`}
          >
            Order via Email
          </ButtonLink>
        )}
      </div>
      {!whatsappNumber && !contactEmail && (
        <p className="text-xs text-ink-soft">
          Ordering channels aren&apos;t configured yet — set them in Admin → Settings.
        </p>
      )}
    </div>
  );
}
