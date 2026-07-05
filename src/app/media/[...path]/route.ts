import { NextResponse } from "next/server";
import mime from "mime-types";

import { storage } from "@/lib/storage";

export const runtime = "nodejs";

// Serves uploaded media:  /media/2026/06/uuid.jpg -> storage media/2026/06/uuid.jpg
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const rel = `media/${path.join("/")}`;
  try {
    const data = await storage.readFile(rel);
    const contentType =
      mime.lookup(path[path.length - 1]) || "application/octet-stream";
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
