import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ButtonLink } from "@/components/ui/Button";

export default async function AdminHomePage() {
  await requireAdmin();
  const db = await createAdminClient();

  const [{ count: totalFonts }, { count: published }, { count: drafts }, { count: categories }] =
    await Promise.all([
      db.from("fonts").select("*", { count: "exact", head: true }),
      db.from("fonts").select("*", { count: "exact", head: true }).eq("status", "published"),
      db.from("fonts").select("*", { count: "exact", head: true }).eq("status", "draft"),
      db.from("categories").select("*", { count: "exact", head: true }),
    ]);

  const stats = [
    { label: "Total fonts", value: totalFonts ?? 0 },
    { label: "Published", value: published ?? 0 },
    { label: "Drafts", value: drafts ?? 0 },
    { label: "Categories", value: categories ?? 0 },
  ];

  return (
    <div>
      <p className="eyebrow-accent mb-3">Overview</p>
      <h1 className="mb-1 font-display text-3xl text-ink">Dashboard</h1>
      <p className="mb-10 text-sm text-ink-soft">A quick read on the catalog and where to go next.</p>

      <div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="border border-line p-5">
            <p className="font-display text-4xl text-ink">{s.value}</p>
            <p className="mt-2 eyebrow">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="border border-line p-6">
        <p className="eyebrow mb-4">Quick actions</p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/admin/fonts/new">+ Add a font</ButtonLink>
          <ButtonLink href="/admin/fonts" variant="secondary">Manage fonts</ButtonLink>
          <ButtonLink href="/admin/homepage" variant="ghost">Edit homepage</ButtonLink>
        </div>
      </div>

      <div className="mt-8 border-t border-line pt-8 text-sm text-ink-soft">
        <p>
          New here? Set your ordering channels in{" "}
          <Link href="/admin/settings" className="underline hover:text-signal">Settings</Link>{" "}
          and add at least one category and license before publishing your first font.
        </p>
      </div>
    </div>
  );
}
