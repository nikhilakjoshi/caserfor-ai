import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // For turbopack, we need to configure the serverComponentsExternalPackages
  // to handle canvas properly for react-pdf
  turbopack: {
    resolveAlias: {
      canvas: "",
    },
  },
};

export default nextConfig;
