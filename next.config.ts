import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "export",  // Uncomment for Cloudflare Pages static export (disables API routes)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
