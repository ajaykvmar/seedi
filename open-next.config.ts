import { defineCloudflareConfig } from "@opennextjs/cloudflare/config";
import kv from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";

export default defineCloudflareConfig({
  incrementalCache: kv,
});
