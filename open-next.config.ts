import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Using default in-memory cache. Swap for a KV/R2-backed incremental
  // cache once traffic grows — see @opennextjs/cloudflare docs.
});
