import Link from "next/link";
import type { FontWithRelations } from "@/lib/types/database";
import { formatPrice, getDiscountPercent } from "@/lib/utils";

const fromPrice = (f: FontWithRelations) =>
  f.license_prices.length ? Math.min(...f.license_prices.map((lp) => lp.price)) : f.price;

/** Compact yellow promo for fonts currently on sale. Renders nothing when there are none. */
export function SaleCard({ fonts }: { fonts: FontWithRelations[] }) {
  if (fonts.length === 0) return null;
  const withPct = fonts
    .map((f) => ({ f, pct: getDiscountPercent(fromPrice(f), f.sale_price as number) }))
    .sort((a, b) => b.pct - a.pct);
  const max = withPct[0].pct;

  return (
    <div className="flex min-h-[260px] flex-col justify-between gap-5 rounded-[32px] bg-yellow p-6 text-ink sm:p-7">
      <div>
        <span className="inline-flex h-7 items-center rounded-full bg-ink px-3.5 text-xs font-bold text-white">Sale</span>
        <h3 className="mt-3 max-w-[16ch] text-[clamp(1.25rem,2.2vw,1.6rem)] font-bold leading-tight tracking-tight">
          Up to {max}% off selected fonts.
        </h3>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[clamp(2.5rem,4.6vw,3.4rem)] font-extrabold leading-none tracking-[-0.04em]">−{max}%</p>
          <p className="mt-2 flex flex-wrap gap-x-3.5 gap-y-1 text-[13px] font-semibold">
            {withPct.slice(0, 3).map(({ f, pct }) => (
              <Link key={f.id} href={`/fonts/${f.slug}`} className="underline underline-offset-[3px]" title={formatPrice(f.sale_price as number, f.currency)}>
                {f.name} −{pct}%
              </Link>
            ))}
          </p>
        </div>
        <Link
          href="/fonts?sale=1"
          className="group/btn inline-flex h-10 items-center gap-2.5 rounded-full bg-ink pl-5 pr-1 text-[13px] font-semibold text-white hover:bg-ink/85"
        >
          Shop sale
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink transition-transform group-hover/btn:translate-x-0.5">→</span>
        </Link>
      </div>
    </div>
  );
}
