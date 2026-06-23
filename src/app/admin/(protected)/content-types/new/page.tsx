import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requirePermission } from "@/server/auth/guard";
import { ContentTypeForm, type ContentTypeData } from "../content-type-form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "New Content Type" };
export const dynamic = "force-dynamic";

export default async function NewContentTypePage() {
  await requirePermission("content_types.manage");

  const data: ContentTypeData = {
    slug: "",
    label: "",
    labelSingular: "",
    description: "",
    icon: "",
    supports: {
      seo: true,
      revisions: true,
      author: true,
      hierarchical: false,
      taxonomies: [],
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/content-types">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">New content type</h1>
      </div>
      <ContentTypeForm data={data} />
    </div>
  );
}
