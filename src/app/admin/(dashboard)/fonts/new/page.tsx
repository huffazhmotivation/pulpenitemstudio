import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { FontForm } from "@/components/admin/FontForm";
import { createFont } from "@/lib/actions/fonts";

const LOCKED_TABS = ["Gallery", "Font Files", "Pricing", "Publish"];

export default async function NewFontPage() {
  await requireAdmin();
  const db = createAdminClient();
  const { data: categories } = await db.from("categories").select("*").order("sort_order");

  return (
    <div>
      <div className="sticky top-0 z-30 -mx-6 -mt-10 mb-6 border-b border-line bg-panel/95 px-6 py-3.5 backdrop-blur md:-mx-10 md:-mt-14 md:px-10">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/fonts" className="shrink-0 text-sm font-medium text-ink-soft transition-colors hover:text-ink">
            ← Fonts
          </Link>
          <span className="text-line">|</span>
          <span className="text-sm font-semibold text-ink">New font</span>
        </div>
      </div>

      <div className="mb-8">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-soft">Fonts</p>
        <h1 className="text-2xl font-semibold text-ink">Add a font</h1>
        <p className="mt-2 max-w-xl text-sm text-ink-soft">
          Save the basic details first. Once created you&apos;ll be able to add styles, upload
          preview/master files, gallery images, and set license prices from the full editor.
        </p>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
        <span className="relative shrink-0 whitespace-nowrap px-4 py-3 text-sm font-medium text-ink">
          <span className="text-xs text-ink-faint">1.</span> Basic
          <span className="absolute inset-x-0 -bottom-px h-[2px] bg-ink" />
        </span>
        {LOCKED_TABS.map((label, i) => (
          <span
            key={label}
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap px-4 py-3 text-sm font-medium text-ink-faint"
            title="Available after you create the font"
          >
            <span className="text-xs text-ink-faint">{i + 2}.</span>
            {label}
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <rect x="3.5" y="7" width="9" height="6.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
              <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </span>
        ))}
      </div>

      <FontForm categories={categories ?? []} action={createFont} />
    </div>
  );
}
