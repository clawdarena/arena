import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // Force all pages to be dynamically rendered (no static prerender)
  // Fixes _global-error prerender crash in Next.js 16/Turbopack
  output: 'standalone',
};

export default nextConfig;
