"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { saveCustomizerAction, type CustomizerState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const COLORS: { key: string; label: string }[] = [
  { key: "colors.primary", label: "Primary" },
  { key: "colors.secondary", label: "Secondary" },
  { key: "colors.accent", label: "Accent" },
  { key: "colors.text", label: "Text" },
  { key: "colors.background", label: "Background" },
];

const FONTS: { key: string; label: string }[] = [
  { key: "fonts.heading", label: "Heading font" },
  { key: "fonts.body", label: "Body font" },
];

export function CustomizerForm({ values }: { values: Record<string, string> }) {
  const [state, formAction, pending] = useActionState(saveCustomizerAction, {});

  useEffect(() => {
    const s = state as CustomizerState;
    if (s.success) toast.success(s.success);
    if (s.error) toast.error(s.error);
  }, [state]);

  return (
    <form action={formAction} className="max-w-xl space-y-8">
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium">Colors</legend>
        {COLORS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <Label htmlFor={key}>{label}</Label>
            <div className="flex items-center gap-2">
              <Input
                id={key}
                name={key}
                type="color"
                defaultValue={values[key] ?? "#000000"}
                className="h-9 w-16 p-1"
              />
              <span className="text-muted-foreground w-20 text-xs">
                {values[key] ?? ""}
              </span>
            </div>
          </div>
        ))}
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium">Typography</legend>
        {FONTS.map(({ key, label }) => (
          <div key={key} className="grid gap-2">
            <Label htmlFor={key}>{label}</Label>
            <Input
              id={key}
              name={key}
              defaultValue={values[key] ?? ""}
              placeholder="Inter, system-ui, sans-serif"
            />
          </div>
        ))}
      </fieldset>

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        Save changes
      </Button>
    </form>
  );
}
