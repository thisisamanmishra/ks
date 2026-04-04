import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /* config options here */
  // @ts-ignore
  allowedDevOrigins: ['10.131.29.105'],
  experimental: {
    serverActions: {
      allowedOrigins: ['10.131.29.105'],
    },
  },
};

export default nextConfig;
