import { NextResponse } from "next/server";

import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  const base = env.APP_URL.replace(/\/$/, "");
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api/",
    "",
    `Sitemap: ${base}/sitemap.xml`,
    "",
  ].join("\n");
  return new NextResponse(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
