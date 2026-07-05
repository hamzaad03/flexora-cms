import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requirePermission } from "@/server/auth/guard";
import {
  FormBuilder,
  type FormData,
} from "@/components/admin/forms/form-builder";
import { newFieldId } from "@/lib/forms";
import { Button } from "@/components/ui/button";

export const metadata = { title: "New Form" };
export const dynamic = "force-dynamic";

export default async function NewFormPage() {
  await requirePermission("forms.manage");

  const form: FormData = {
    slug: "",
    name: "Contact form",
    isActive: true,
    fields: [
      {
        id: newFieldId(),
        type: "text",
        name: "name",
        label: "Name",
        required: true,
        width: "half",
      },
      {
        id: newFieldId(),
        type: "email",
        name: "email",
        label: "Email",
        required: true,
        width: "half",
      },
      {
        id: newFieldId(),
        type: "textarea",
        name: "message",
        label: "Message",
        required: true,
        width: "full",
      },
    ],
    settings: {
      submitLabel: "Send",
      successMessage: "Thanks — we'll be in touch.",
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/forms">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">New form</h1>
      </div>
      <FormBuilder form={form} />
    </div>
  );
}
