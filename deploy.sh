#!/bin/bash
# deploy.sh — Build and deploy to Cloudflare Pages
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Building with OpenNext..."
npx opennextjs-cloudflare build

echo ""
echo "==> Preparing Pages output..."
DEPLOY_DIR=".open-next-pages"
rm -rf "$DEPLOY_DIR"

# Copy the full .open-next (needed for worker imports)
cp -r .open-next "$DEPLOY_DIR"

# Move assets to root so /_next/static/... resolves correctly
cp -r "$DEPLOY_DIR/assets/"* "$DEPLOY_DIR/"
rm -rf "$DEPLOY_DIR/assets"

# Create _worker.js that first tries static assets, then falls through to Next.js
cat > "$DEPLOY_DIR/_worker.js" << 'WORKER_EOF'
import { handleCdnCgiImageRequest, handleImageRequest } from "./cloudflare/images.js";
import { runWithCloudflareRequestContext } from "./cloudflare/init.js";
import { maybeGetSkewProtectionResponse } from "./cloudflare/skew-protection.js";
import { handler as middlewareHandler } from "./middleware/handler.mjs";
export { DOQueueHandler } from "./.build/durable-objects/queue.js";
export { DOShardedTagCache } from "./.build/durable-objects/sharded-tag-cache.js";
export { BucketCachePurge } from "./.build/durable-objects/bucket-cache-purge.js";
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Serve static assets from env.ASSETS (Cloudflare Pages static files)
        if (url.pathname.startsWith("/_next/static/") || url.pathname === "/favicon.ico") {
            const asset = await env.ASSETS.fetch(request);
            if (asset.status !== 404) return asset;
        }

        return runWithCloudflareRequestContext(request, env, ctx, async () => {
            const response = maybeGetSkewProtectionResponse(request);
            if (response) return response;

            if (url.pathname.startsWith("/cdn-cgi/image/")) {
                return handleCdnCgiImageRequest(url, env);
            }
            if (url.pathname === `${globalThis.__NEXT_BASE_PATH__}/_next/image${globalThis.__TRAILING_SLASH__ ? "/" : ""}`) {
                return await handleImageRequest(url, request.headers, env);
            }

            const reqOrResp = await middlewareHandler(request, env, ctx);
            if (reqOrResp instanceof Response) return reqOrResp;

            const { handler } = await import("./server-functions/default/handler.mjs");
            return handler(reqOrResp, env, ctx, request.signal);
        });
    },
};
WORKER_EOF

echo ""
echo "==> Deploying to Cloudflare Pages..."
npx wrangler pages deploy "$DEPLOY_DIR" --branch main --project-name seedi

echo ""
echo "Done! Check https://seedi.pages.dev"
