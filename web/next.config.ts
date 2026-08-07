import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep firebase-admin out of the bundler — avoids broken serverless boots on Vercel.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
