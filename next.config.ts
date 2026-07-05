import type { NextConfig, SizeLimit } from "next";

function getServerActionsBodySizeLimit(): SizeLimit {
  const value = process.env.SERVER_ACTIONS_BODY_SIZE_LIMIT;
  if (!value) {
    return "25mb";
  }

  if (/^\d+$/.test(value)) {
    return Number(value);
  }

  if (/^\d+(?:\.\d+)?[kKmMgGtTpP][bB]$/.test(value)) {
    return value as SizeLimit;
  }

  throw new Error(
    "SERVER_ACTIONS_BODY_SIZE_LIMIT must be a byte count or size string such as 500kb, 10mb, or 25mb.",
  );
}

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
  experimental: {
    serverActions: {
      bodySizeLimit: getServerActionsBodySizeLimit(),
    },
  },
};

export default nextConfig;
