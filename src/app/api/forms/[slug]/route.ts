import { NextResponse } from "next/server";

import { handleSubmission } from "@/server/services/forms";
import { clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  // Same-origin (CSRF) guard.
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return NextResponse.json({ ok: false }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ ok: false }, { status: 403 });
    }
  }

  const { slug } = await params;
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false }, { status: 400 });

  const raw: Record<string, string> = {};
  for (const [k, v] of form.entries()) {
    if (typeof v === "string") raw[k] = v;
  }

  const ip = clientIp(req.headers);
  const ua = req.headers.get("user-agent") ?? "";
  const result = await handleSubmission(slug, raw, { ip, ua });

  // No-JS fallback: redirect back to the referring page.
  const accept = req.headers.get("accept") ?? "";
  if (!accept.includes("application/json")) {
    const ref = req.headers.get("referer");
    const url = ref ? new URL(ref) : new URL("/", req.url);
    url.searchParams.set("flxform", result.ok ? "ok" : "error");
    return NextResponse.redirect(url, 303);
  }

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
