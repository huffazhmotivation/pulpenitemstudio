import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/db";
import { getMediaBucket } from "@/lib/d1/storage";
import { BUCKETS } from "@/lib/storage";

/**
 * Admin-only download of a master font file, so the studio owner can fetch the
 * real OTF/TTF/ZIP to send to a customer after an order comes in via
 * WhatsApp/email. Master files live under a private R2 prefix that the public
 * /media route refuses to serve; this route is the only way to reach them and
 * it always re-checks the admin session first.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  await requireAdmin();
  const { fileId } = await params;

  const db = await createAdminClient();
  const { data: file, error } = await db
    .from("font_files")
    .select("storage_path, file_type, format")
    .eq("id", fileId)
    .eq("file_type", "master")
    .single();

  if (error || !file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const r2 = await getMediaBucket();
  const object = await r2.get(`${BUCKETS.masters}/${file.storage_path}`);
  if (!object) {
    return NextResponse.json({ error: "File missing from storage" }, { status: 404 });
  }

  const filename = String(file.storage_path).split("/").pop()?.replace(/[^\w.\- ]+/g, "_") || `font.${file.format}`;
  return new Response(object.body as unknown as BodyInit, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
      "Content-Length": String(object.size),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
