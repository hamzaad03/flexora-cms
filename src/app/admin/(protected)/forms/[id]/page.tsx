import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Inbox } from "lucide-react";

import { requirePermission } from "@/server/auth/guard";
import { getForm } from "@/server/services/forms";
import {
  FormBuilder,
  type FormData,
} from "@/components/admin/forms/form-builder";
import type { FormField, FormSettings } from "@/lib/forms";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function EditFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePermission("forms.manage");

  const form = await getForm(id);
  if (!form) notFound();

  const data: FormData = {
    id: form.id,
    slug: form.slug,
    name: form.name,
    isActive: form.isActive,
    fields: (form.fields as FormField[]) ?? [],
    settings: (form.settings as FormSettings) ?? {},
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/admin/forms">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">{form.name}</h1>
        </div>
        <Button asChild variant="outline">
          <Link href={`/admin/forms/${form.id}/submissions`}>
            <Inbox className="size-4" /> Submissions
          </Link>
        </Button>
      </div>
      <FormBuilder form={data} />
    </div>
  );
}
