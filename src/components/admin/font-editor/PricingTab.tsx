"use client";

import { removeLicensePrice, setLicensePrice } from "@/lib/actions/fonts";
import { formatPrice } from "@/lib/utils";
import type { License, LicensePrice } from "@/lib/types/database";
import type { CoreFields } from "./types";
import { Card, FieldRow, FieldLabel, Toggle, EmptyState } from "./fields";
import { SavedIndicator } from "@/components/admin/Toast";
import { useSavedAction } from "./useSavedAction";

const inputClass =
  "w-full rounded-sm border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink transition-colors";

export function PricingTab({
  fontId,
  values,
  setValue,
  licenses,
  licensePrices,
}: {
  fontId: string;
  values: CoreFields;
  setValue: <K extends keyof CoreFields>(key: K, value: CoreFields[K]) => void;
  licenses: License[];
  licensePrices: LicensePrice[];
}) {
  return (
    <div className="space-y-6">
      <Card title="Regular price" description="The base price shown when a font isn't on sale.">
        <FieldRow cols={2}>
          <div>
            <FieldLabel htmlFor="price">Regular price</FieldLabel>
            <input
              id="price"
              type="number"
              step="0.01"
              min={0}
              value={values.price}
              onChange={(e) => setValue("price", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel htmlFor="currency">Currency</FieldLabel>
            <input
              id="currency"
              value={values.currency}
              onChange={(e) => setValue("currency", e.target.value.toUpperCase())}
              className={inputClass}
            />
          </div>
        </FieldRow>
      </Card>

      <Card title="Sale" description="Show a Sale badge and discounted price on cards and the homepage.">
        <div className="mb-5">
          <Toggle
            id="is_on_sale"
            checked={values.is_on_sale}
            onChange={(v) => setValue("is_on_sale", v)}
            label="Put this font on sale"
          />
        </div>
        <FieldRow cols={3}>
          <div>
            <FieldLabel htmlFor="sale_price">Sale price</FieldLabel>
            <input
              id="sale_price"
              type="number"
              step="0.01"
              min={0}
              placeholder="Must be less than regular price"
              value={values.sale_price}
              onChange={(e) => setValue("sale_price", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel htmlFor="sale_starts_at">Sale starts (optional)</FieldLabel>
            <input
              id="sale_starts_at"
              type="datetime-local"
              value={values.sale_starts_at}
              onChange={(e) => setValue("sale_starts_at", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel htmlFor="sale_ends_at">Sale ends (optional)</FieldLabel>
            <input
              id="sale_ends_at"
              type="datetime-local"
              value={values.sale_ends_at}
              onChange={(e) => setValue("sale_ends_at", e.target.value)}
              className={inputClass}
            />
          </div>
        </FieldRow>
        <p className="mt-3 text-xs text-ink-soft">Leave the dates blank for a sale that runs until you turn the toggle off.</p>
      </Card>

      <Card title="License prices" description="Per-license pricing shown at checkout.">
        {licenses.length === 0 ? (
          <EmptyState>No license types yet — add some in Admin → Licenses first.</EmptyState>
        ) : (
          <div className="space-y-2.5">
            {licenses.map((license) => (
              <LicensePriceRow
                key={license.id}
                fontId={fontId}
                license={license}
                existing={licensePrices.find((lp) => lp.license_id === license.id)}
                currency={values.currency}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function LicensePriceRow({
  fontId,
  license,
  existing,
  currency,
}: {
  fontId: string;
  license: License;
  existing: LicensePrice | undefined;
  currency: string;
}) {
  const save = useSavedAction();
  const clear = useSavedAction();

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-paper/40 px-4 py-2.5">
      <span className="w-32 shrink-0 text-sm text-ink">{license.name}</span>
      <input
        type="number"
        step="0.01"
        min={0}
        defaultValue={existing?.price ?? ""}
        placeholder="Price"
        onBlur={(e) => {
          const price = Number(e.target.value || 0);
          save.run(() => setLicensePrice(fontId, license.id, price, currency), {
            successMessage: `${license.name} price saved.`,
          });
        }}
        className="max-w-[160px] flex-1 rounded-sm border border-line bg-paper px-3 py-1.5 text-sm text-ink focus:outline-none focus:border-ink"
      />
      <SavedIndicator state={save.state} />
      {existing && (
        <>
          <span className="ml-auto text-xs text-ink-soft">{formatPrice(existing.price, currency)}</span>
          <button
            type="button"
            disabled={clear.isPending}
            onClick={() => clear.run(() => removeLicensePrice(fontId, license.id), { successMessage: "Cleared." })}
            className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-soft hover:text-sale"
          >
            Clear
          </button>
        </>
      )}
    </div>
  );
}
