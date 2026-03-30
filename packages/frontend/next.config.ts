import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      "pino-pretty": { browser: "./src/lib/empty.ts" },
      "@react-native-async-storage/async-storage": { browser: "./src/lib/empty.ts" },
    },
  },

  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      "pino-pretty": false,
      "@react-native-async-storage/async-storage": false,
    };
    return config;
  },
  /* config options here */
};

export default nextConfig;
