import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { FontEditorShell } from "@/components/admin/font-editor/FontEditorShell";

export default async function EditFontPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const db = createAdminClient();

  const [{ data: font }, { data: categories }, { data: licenses }] = await Promise.all([
    db
      .from("fonts")
      .select(
        "*, styles:font_styles(*), files:font_files(*), images:font_images(*), license_prices(*)"
      )
      .eq("id", id)
      .single(),
    db.from("categories").select("*").order("sort_order"),
    db.from("licenses").select("*").order("sort_order"),
  ]);

  if (!font) notFound();

  return (
    <FontEditorShell
      font={font}
      categories={categories ?? []}
      licenses={licenses ?? []}
      licensePrices={font.license_prices ?? []}
      styles={font.styles ?? []}
      files={font.files ?? []}
      images={font.images ?? []}
    />
  );
}
