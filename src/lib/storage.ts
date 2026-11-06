import { MEDIA_PREFIX } from "@/lib/d1/media-path";

export const BUCKETS = {
  previews: "font-previews",
  images: "font-images",
  masters: "font-masters", // private — never resolve a public URL for this
} as const;

/** Public URL for an object in a public bucket (served by the /media route from R2). */
export function publicStorageUrl(bucket: string, path: string): string {
  return `${MEDIA_PREFIX}/${bucket}/${path}`;
}
