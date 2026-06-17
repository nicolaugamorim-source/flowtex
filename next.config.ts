import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    fetches: {
      fullUrl: false,
      hmrRefresh: false,
      unmatchedRoutes: false,
    },
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  experimental: {
    loggingLevel: 'error',
  },
};

export default nextConfig;
