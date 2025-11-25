import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Optimize for Edge Functions
  experimental: {
    // Reduce middleware bundle size
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
