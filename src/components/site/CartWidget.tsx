"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/lib/cart/CartContext";
import { buildWhatsAppLink, type OrderLine } from "@/lib/order-links";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function CartWidget({ whatsappNumber }: { whatsappNumber: string | null }) {
  const { items, removeItem, clearCart, itemCount } = useCart();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Portals need `document`, which only exists once mounted on the client
  useEffect(() => setMounted(true), []);

  // Close on Escape + lock page scroll while the drawer is open
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const siteUrl = typeof window !== "undefined" ? window.location.origin : undefined;

  const currencies = Array.from(new Set(items.map((i) => i.currency)));
  const total = items.reduce((sum, i) => sum + i.price, 0);
  const singleCurrency = currencies.length <= 1 ? currencies[0] : null;

  const orderLines: OrderLine[] = items.map((i) => ({
    fontName: i.fontName,
    fontSlug: i.fontSlug,
    licenseName: i.licenseName,
    price: i.price,
    currency: i.currency,
  }));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open cart"
        className="relative flex h-9 w-9 items-center justify-center rounded-md border border-line text-ink transition-colors hover:bg-panel-2"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="9" cy="21" r="1.25" />
          <circle cx="18" cy="21" r="1.25" />
          <path d="M2.5 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 7H6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {itemCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-signal px-1 text-[10px] font-semibold text-paper shadow-[0_0_10px_-1px_rgba(163,230,53,0.8)]">
            {itemCount}
            <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-signal opacity-60" />
          </span>
        )}
      </button>

      {mounted && open && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            aria-label="Close cart"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
          />
          <div className="glass-panel-signal flex max-h-[85vh] w-full max-w-md flex-col bg-paper/90 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <p className="font-display text-lg font-semibold text-ink">Cart ({itemCount})</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close cart"
                className="text-ink-soft hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <p className="text-sm text-ink-soft">
                  Your cart is empty. Pick a license on any font page and add it here.
                </p>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start justify-between gap-3 rounded-md border border-line p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{item.fontName}</p>
                        <p className="text-xs text-ink-soft">{item.licenseName}</p>
                        <p className="mt-1 font-mono text-xs text-ink">{formatPrice(item.price, item.currency)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="shrink-0 text-xs font-semibold text-sale hover:underline"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="space-y-3 rounded-b-lg border-t border-line bg-panel px-5 py-4">
                <div className="flex items-baseline justify-between">
                  <span className="eyebrow">Total</span>
                  <span className="font-mono text-xl font-semibold text-ink">
                    {singleCurrency ? formatPrice(total, singleCurrency) : "See items above"}
                  </span>
                </div>
                {whatsappNumber ? (
                  <Button
                    variant="signal"
                    className="w-full"
                    onClick={() => {
                      const link = buildWhatsAppLink(whatsappNumber, orderLines, { siteUrl });
                      window.open(link, "_blank", "noopener,noreferrer");
                    }}
                  >
                    Buy via WhatsApp
                  </Button>
                ) : (
                  <p className="text-xs text-ink-soft">
                    WhatsApp isn&apos;t configured yet — set it in Admin → Settings.
                  </p>
                )}
                <button
                  type="button"
                  onClick={clearCart}
                  className="w-full text-center text-xs text-ink-soft hover:text-ink"
                >
                  Clear cart
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
