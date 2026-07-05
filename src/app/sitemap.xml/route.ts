import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const base = env.APP_URL.replace(/\/$/, "");

  const entries = await db.contentEntry.findMany({
    where: {
      OR: [
        { status: "PUBLISHED" },
        { status: "SCHEDULED", publishedAt: { lte: new Date() } },
      ],
    },
    select: {
      slug: true,
      updatedAt: true,
      contentType: { select: { slug: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const urls = entries
    .map((e) => {
      const loc =
        e.contentType.slug === "page" && e.slug === "home"
          ? `${base}/`
          : `${base}/${e.slug}`;
      return `<url><loc>${loc}</loc><lastmod>${e.updatedAt.toISOString()}</lastmod></url>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
