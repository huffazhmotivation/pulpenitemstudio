import { getMediaBucket } from "@/lib/d1/storage";
import { BUCKETS } from "@/lib/storage";

/**
 * Public read-only access to R2 objects (font previews + images). Master font
 * files are deliberately NOT served here: only the public prefixes are
 * allowed, and anything else is a 404. Keys contain a random id, so objects
 * are immutable and cached for a year, both in the browser and at the edge.
 */
const PUBLIC_BUCKETS = new Set<string>([BUCKETS.previews, BUCKETS.images]);

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const segments = path.map((s) => decodeURIComponent(s));
  if (segments.length < 2 || segments.some((s) => s === ".." || s === "." || s === "")) {
    return new Response("Not found", { status: 404 });
  }
  if (!PUBLIC_BUCKETS.has(segments[0])) return new Response("Not found", { status: 404 });

  const cache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default;
  const cacheKey = new Request(new URL(request.url).toString(), { method: "GET" });
  const hit = await cache?.match(cacheKey);
  if (hit) return hit;

  const r2 = await getMediaBucket();
  const object = await r2.get(segments.join("/"));
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers({
    "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
    "Content-Length": String(object.size),
    "Cache-Control": "public, max-age=31536000, immutable",
    ETag: object.httpEtag,
    "Access-Control-Allow-Origin": "*", // fonts loaded via FontFace need CORS
    "X-Content-Type-Options": "nosniff",
  });
  const response = new Response(object.body as unknown as BodyInit, { headers });
  if (cache) {
    try {
      await cache.put(cacheKey, response.clone());
    } catch {
      // caching is best-effort
    }
  }
  return response;
}
