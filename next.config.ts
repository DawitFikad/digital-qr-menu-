import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: path.resolve(__dirname),
  experimental: {
    staticGenerationMaxConcurrency: 1,
  },
};

export default nextConfig;
