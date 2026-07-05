import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { UAParser } from "ua-parser-js";

import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

// First-party analytics collector. Privacy-friendly: the visitor is identified
// by a daily-rotating salted hash of IP+UA (no raw IP or cookie stored).
export async function POST(req: Request) {
  try {
    // Rate-limit per IP to deter beacon spam (60 hits / minute).
    const ip = clientIp(req.headers);
    if (!rateLimit(`track:${ip}`, 60, 60_000).ok) {
      return NextResponse.json({ ok: false }, { status: 429 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      path?: unknown;
      referrer?: unknown;
    };
    const path = typeof body.path === "string" ? body.path.slice(0, 500) : "/";
    if (path.startsWith("/admin") || path.startsWith("/api")) {
      return NextResponse.json({ ok: true });
    }
    const referrer =
      typeof body.referrer === "string" && body.referrer
        ? body.referrer.slice(0, 500)
        : null;

    const ua = req.headers.get("user-agent") ?? "";
    const day = new Date().toISOString().slice(0, 10);
    const visitorHash = createHash("sha256")
      .update(`${ip}|${ua}|${day}`)
      .digest("hex")
      .slice(0, 32);

    const parsed = new UAParser(ua).getResult();
    const device = parsed.device.type ?? "desktop";
    const country =
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cf-ipcountry") ||
      null;

    await db.pageView.create({
      data: { path, referrer, visitorHash, device, country },
    });
    return NextResponse.json({ ok: true });
  } catch {
    // Never fail the page over analytics.
    return NextResponse.json({ ok: false });
  }
}
