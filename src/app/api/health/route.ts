import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Liveness + DB readiness probe for load balancers / uptime monitors.
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: true });
  } catch {
    return NextResponse.json({ status: "error", db: false }, { status: 503 });
  }
}
