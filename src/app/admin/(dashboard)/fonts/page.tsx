import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";

export default async function AdminFontsPage() {
  await requireAdmin();
  const db = await createAdminClient();

  const { data: fonts } = await db
    .from("fonts")
    .select("id, name, slug, status, is_featured, is_new, price, currency, category:categories(name)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="eyebrow-accent mb-3">Catalog</p>
          <h1 className="font-display text-3xl text-ink">Fonts</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {fonts?.length ?? 0} font{(fonts?.length ?? 0) === 1 ? "" : "s"} in the catalog
          </p>
        </div>
        <ButtonLink href="/admin/fonts/new">+ Add font</ButtonLink>
      </div>

      <div className="border border-line">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-line bg-paper-dim/50 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
          <span>Font</span>
          <span>Category</span>
          <span>Price</span>
          <span>Status</span>
        </div>
        {(fonts ?? []).map((font: any) => (
          <Link
            key={font.id}
            href={`/admin/fonts/${font.id}`}
            className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b border-line px-4 py-4 text-sm transition-colors last:border-b-0 hover:bg-paper-dim/30"
          >
            <span className="flex flex-wrap items-center gap-2 text-ink">
              <span className="font-medium">{font.name}</span>
              {font.is_featured && <Badge>Featured</Badge>}
              {font.is_new && <Badge className="border-signal text-signal">New</Badge>}
            </span>
            <span className="text-ink-soft">{font.category?.name ?? "—"}</span>
            <span className="text-ink-soft">{formatPrice(font.price, font.currency)}</span>
            <span>
              <Badge className={font.status === "published" ? "border-signal text-signal" : ""}>
                {font.status}
              </Badge>
            </span>
          </Link>
        ))}
        {(!fonts || fonts.length === 0) && (
          <p className="px-4 py-16 text-center text-sm text-ink-soft">
            No fonts yet — <Link href="/admin/fonts/new" className="underline hover:text-signal">add your first one</Link>.
          </p>
        )}
      </div>
    </div>
  );
}
