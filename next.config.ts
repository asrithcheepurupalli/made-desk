import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // The browser sends a workspace snapshot to the AI assistant, since the server stores nothing
    serverActions: { bodySizeLimit: "10mb" },
  },
  turbopack: {
    // filestore has a Node-only branch for the local CLI. Keep it out of the browser bundle.
    resolveAlias: {
      "node:fs/promises": { browser: "./src/lib/store/empty.ts" },
      "node:path": { browser: "./src/lib/store/empty.ts" },
    },
  },
};

export default nextConfig;
