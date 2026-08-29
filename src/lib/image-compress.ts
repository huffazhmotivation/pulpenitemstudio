"use client";

/**
 * Client-side image resize + compression, run in the browser (via
 * <canvas>) *before* a file is uploaded. This is what keeps admin
 * uploads (cover, gallery/specimen, hero) from ever hitting the
 * server as multi-MB originals straight off a phone/camera — which is
 * what was causing uploads to hang on "Saving…" and made the
 * homepage heavy to load.
 *
 * Bounding box: long edge capped at 5000px, short edge capped at
 * 3000px (so a 3000×5000 portrait or 5000×3000 landscape both fit
 * without stretching), aspect ratio preserved. Re-encoded as WebP for
 * a large size reduction with no visible quality loss at web sizes.
 */

const MAX_LONG_EDGE = 5000;
const MAX_SHORT_EDGE = 3000;
const OUTPUT_QUALITY = 0.82;
const OUTPUT_TYPE = "image/webp";

export async function compressImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;

    const isLandscape = width >= height;
    const maxW = isLandscape ? MAX_LONG_EDGE : MAX_SHORT_EDGE;
    const maxH = isLandscape ? MAX_SHORT_EDGE : MAX_LONG_EDGE;
    const scale = Math.min(1, maxW / width, maxH / height);

    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    bitmap.close?.();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, OUTPUT_TYPE, OUTPUT_QUALITY)
    );
    if (!blob) return file;

    // If nothing needed resizing and the re-encode didn't actually
    // save anything, keep the original rather than swap formats for
    // no benefit.
    if (scale === 1 && blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], newName, { type: OUTPUT_TYPE });
  } catch {
    // Any decode/encode failure (unsupported format, browser quirk,
    // etc.) falls back to uploading the original file untouched —
    // compression is a nice-to-have, not a hard requirement.
    return file;
  }
}

/** Runs compressImageForUpload over a list of files, in order. */
export async function compressImagesForUpload(files: File[]): Promise<File[]> {
  const out: File[] = [];
  for (const file of files) {
    out.push(await compressImageForUpload(file));
  }
  return out;
}
