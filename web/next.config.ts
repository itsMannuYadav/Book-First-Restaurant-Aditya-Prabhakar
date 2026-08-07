import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Do NOT externalize firebase-admin on Vercel.
  // External CJS load of jwks-rsa → require('jose') fails because jose@6 is ESM-only.
};

export default nextConfig;