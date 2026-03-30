import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // turbopack: {
  //   resolveAlias: {
  //     "pino-pretty": { browser: "./src/lib/empty.ts" },
  //     "@react-native-async-storage/async-storage": { browser: "./src/lib/empty.ts" },
  //   },
  // },

  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      "pino-pretty": false,
      "@react-native-async-storage/async-storage": false,
    };
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name: 'lib',
            priority: 30,
            chunks: 'all',
          },
        },
      },
    };
    return config;
  },
  /* config options here */
};

export default nextConfig;
