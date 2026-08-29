import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUCKETS } from "@/lib/storage";

/**
 * Admin-only signed URL for a master font file, so the studio owner can
 * fetch the real OTF/TTF/ZIP to send to a customer after an order comes
 * in via WhatsApp/email. Master files are never linked publicly —
 * this route is the only way to reach them, and it always re-checks
 * the admin session first.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  await requireAdmin();
  const { fileId } = await params;

  const db = createAdminClient();
  const { data: file, error } = await db
    .from("font_files")
    .select("storage_path, file_type")
    .eq("id", fileId)
    .eq("file_type", "master")
    .single();

  if (error || !file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const { data: signed, error: signError } = await db.storage
    .from(BUCKETS.masters)
    .createSignedUrl(file.storage_path, 60); // 60 second link

  if (signError || !signed) {
    return NextResponse.json({ error: "Could not create download link" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
