import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // react-pdf requires canvas polyfill exclusion for SSR
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
