"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Wand2 } from "lucide-react";

import { initializeBuilderDocumentAction } from "@/app/admin/(protected)/content/[type]/[id]/builder/actions";
import { Button } from "@/components/ui/button";

export function InitializeBuilderButton({
  entryId,
  typeSlug,
}: {
  entryId: string;
  typeSlug: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const initialize = () => {
    startTransition(async () => {
      const res = await initializeBuilderDocumentAction(entryId, typeSlug);
      if (!res.ok) {
        toast.error(res.error ?? "Failed to initialize builder.");
        return;
      }
      toast.success("Builder document created.");
      router.refresh();
    });
  };

  return (
    <Button onClick={initialize} disabled={pending}>
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Wand2 className="size-4" />
      )}
      Create empty builder document
    </Button>
  );
}
