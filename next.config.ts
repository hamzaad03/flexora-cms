import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server build for shared hosting (cPanel Node / Plesk) and VPS.
  output: "standalone",
  images: {
    // Media is served from the local storage abstraction; allow same-origin
    // optimization and remote sources configured later via settings.
    remotePatterns: [],
  },
  // Server-only packages that must not be bundled for the client/edge.
  serverExternalPackages: ["@prisma/client", "bcryptjs", "pino", "sharp"],
};

export default nextConfig;
