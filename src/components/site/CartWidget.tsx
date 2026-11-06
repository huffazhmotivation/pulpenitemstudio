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
        className="relative flex h-12 w-12 items-center justify-center rounded-full bg-panel text-ink shadow-card transition-transform hover:-translate-y-0.5"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1.25" />
          <circle cx="18" cy="21" r="1.25" />
          <path d="M2.5 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 7H6" />
        </svg>
        {itemCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-signal px-1.5 text-[11px] font-bold text-white">
            {itemCount}
          </span>
        )}
      </button>

      {mounted && createPortal(
        <>
          <button
            aria-label="Close cart"
            onClick={() => setOpen(false)}
            className={`fixed inset-0 z-[100] bg-ink/40 backdrop-blur-[3px] transition-opacity duration-200 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
          />
          <aside
            aria-label="Cart"
            aria-hidden={!open}
            className={`fixed bottom-2.5 right-2.5 top-2.5 z-[101] flex w-[min(430px,calc(100%-20px))] flex-col rounded-2xl bg-panel shadow-lift transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-[110%]"}`}
          >
            <div className="flex items-center justify-between px-6 pb-3 pt-6">
              <p className="text-2xl font-extrabold tracking-tight text-ink">Your cart</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close cart"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-paper text-ink hover:bg-paper-dim"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
              {items.length === 0 ? (
                <div className="mt-2 rounded-xl bg-paper px-5 py-10 text-center text-sm text-ink-soft">
                  Your cart is empty. Pick a license on any font page and add it here.
                </div>
              ) : (
                <ul>
                  {items.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-3 border-b border-line py-4 last:border-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink">{item.fontName}</p>
                        <p className="text-xs text-ink-soft">{item.licenseName} license</p>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="mt-1 text-xs text-ink-soft underline hover:text-sale"
                        >
                          Remove
                        </button>
                      </div>
                      <p className="shrink-0 text-sm font-bold text-ink">{formatPrice(item.price, item.currency)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="space-y-3 px-6 pb-6 pt-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-ink-soft">Total</span>
                  <span className="text-3xl font-extrabold tracking-tight text-ink">
                    {singleCurrency ? formatPrice(total, singleCurrency) : "See items above"}
                  </span>
                </div>
                {whatsappNumber ? (
                  <Button
                    variant="signal"
                    arrow
                    className="w-full justify-between"
                    onClick={() => {
                      const link = buildWhatsAppLink(whatsappNumber, orderLines, { siteUrl });
                      window.open(link, "_blank", "noopener,noreferrer");
                    }}
                  >
                    Buy via WhatsApp
                  </Button>
                ) : (
                  <p className="text-xs text-ink-soft">
                    WhatsApp isn&apos;t configured yet. Set it in Admin → Settings.
                  </p>
                )}
                <button type="button" onClick={clearCart} className="w-full text-center text-xs text-ink-soft hover:text-ink">
                  Clear cart
                </button>
              </div>
            )}
          </aside>
        </>,
        document.body
      )}
    </>
  );
}
