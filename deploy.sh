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
cp -r .open-next "$DEPLOY_DIR"
cp "$DEPLOY_DIR/worker.js" "$DEPLOY_DIR/_worker.js"

echo ""
echo "==> Deploying to Cloudflare Pages..."
npx wrangler pages deploy "$DEPLOY_DIR" --branch main --project-name seedi

echo ""
echo "Done! Check https://seedi.pages.dev"
