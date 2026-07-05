import { NextResponse } from "next/server";
import mime from "mime-types";

import { storage } from "@/lib/storage";
import { themeFile } from "@/server/theme/paths";

export const runtime = "nodejs";

// Serves files from a theme's `assets/` directory:
//   /theme-assets/<slug>/css/style.css  ->  themes/<slug>/assets/css/style.css
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; path: string[] }> },
) {
  const { slug, path } = await params;
  const relative = themeFile(slug, `assets/${path.join("/")}`);

  try {
    // storage.readFile resolves through the safe resolver (rejects traversal).
    const data = await storage.readFile(relative);
    const contentType =
      mime.lookup(path[path.length - 1]) || "application/octet-stream";
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, must-revalidate",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
