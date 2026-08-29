const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export const BUCKETS = {
  previews: "font-previews",
  images: "font-images",
  masters: "font-masters", // private — never resolve a public URL for this
} as const;

/** Public URL for an object in a public bucket. */
export function publicStorageUrl(bucket: string, path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}
