import Link from "next/link";
import { FileText, SearchX } from "lucide-react";

import { requirePermission } from "@/server/auth/guard";
import { searchEntries } from "@/server/services/content";
import { Card } from "@/components/ui/card";
import {
  StatusBadge,
  formatRelative,
} from "@/components/admin/dashboard/format";

export const metadata = { title: "Search" };
export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  await requirePermission("content.view");
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.slice(0, 200) ?? "";
  const results = await searchEntries(q);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground text-sm">
          {q
            ? `${results.length} result${results.length === 1 ? "" : "s"} for “${q}” in content titles`
            : "Type in the search box above to find pages, posts and other content."}
        </p>
      </div>

      {q && results.length === 0 ? (
        <Card className="items-center gap-2 py-12 text-center">
          <SearchX className="text-muted-foreground size-8" />
          <p className="font-medium">No content matches “{q}”</p>
          <p className="text-muted-foreground text-sm">
            Search looks at titles across all content types.
          </p>
        </Card>
      ) : null}

      {results.length > 0 ? (
        <Card className="gap-0 p-0">
          <ul className="divide-y">
            {results.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/admin/content/${r.contentType.slug}/${r.id}`}
                  className="hover:bg-muted/60 flex items-center gap-3 px-4 py-3 transition-colors"
                >
                  <span className="bg-accent text-primary grid size-9 shrink-0 place-items-center rounded-lg">
                    <FileText className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {r.title}
                    </span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {r.contentType.labelSingular} · /{r.slug} · updated{" "}
                      {formatRelative(r.updatedAt)}
                    </span>
                  </span>
                  <StatusBadge status={r.status} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
