import { ExternalLink } from "lucide-react";

import { requirePermission } from "@/server/auth/guard";
import { listRedirects } from "@/server/services/redirect";
import { RedirectsManager, type RedirectRow } from "./redirects-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "SEO" };
export const dynamic = "force-dynamic";

export default async function SeoPage() {
  await requirePermission("seo.manage");
  const redirects = await listRedirects();
  const rows: RedirectRow[] = redirects.map((r) => ({
    id: r.id,
    from: r.from,
    to: r.to,
    code: r.code,
    hits: r.hits,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">SEO</h1>
        <p className="text-muted-foreground text-sm">
          Per-page SEO is edited on each entry. Manage redirects and sitemaps
          here.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sitemaps & robots</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 text-sm">
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noreferrer"
            className="text-primary inline-flex items-center gap-1 hover:underline"
          >
            sitemap.xml <ExternalLink className="size-3.5" />
          </a>
          <a
            href="/robots.txt"
            target="_blank"
            rel="noreferrer"
            className="text-primary inline-flex items-center gap-1 hover:underline"
          >
            robots.txt <ExternalLink className="size-3.5" />
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Redirects</CardTitle>
        </CardHeader>
        <CardContent>
          <RedirectsManager rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
