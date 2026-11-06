import type { D1Database, R2Bucket } from "@cloudflare/workers-types";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Public prefix the Worker serves R2 objects under (see src/app/media). */
import { MEDIA_PREFIX } from "@/lib/d1/media-path";
export { MEDIA_PREFIX };

export async function getMediaBucket(): Promise<R2Bucket> {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.MEDIA) throw new Error("Cloudflare R2 binding `MEDIA` is not configured (see wrangler.toml).");
  return env.MEDIA;
}

/**
 * supabase-storage-shaped wrapper over one R2 bucket. Each logical bucket
 * (font-previews, font-images, font-masters) is a key prefix inside it.
 */
export function storageFrom(bucket: string) {
  const key = (path: string) => `${bucket}/${path}`;
  return {
    async upload(path: string, file: Blob, opts?: { contentType?: string; upsert?: boolean }) {
      try {
        const r2 = await getMediaBucket();
        await r2.put(key(path), await file.arrayBuffer(), {
          httpMetadata: { contentType: opts?.contentType || file.type || "application/octet-stream" },
        });
        return { data: { path }, error: null };
      } catch (e) {
        return { data: null, error: { message: e instanceof Error ? e.message : "Upload failed" } };
      }
    },
    async remove(paths: string[]) {
      try {
        if (paths.length) {
          const r2 = await getMediaBucket();
          await r2.delete(paths.map(key));
        }
        return { data: paths, error: null };
      } catch (e) {
        return { data: null, error: { message: e instanceof Error ? e.message : "Delete failed" } };
      }
    },
    getPublicUrl(path: string) {
      return { data: { publicUrl: `${MEDIA_PREFIX}/${bucket}/${path}` } };
    },
  };
}
