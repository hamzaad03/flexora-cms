"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { togglePluginAction } from "./actions";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export type PluginRow = {
  slug: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  isEnabled: boolean;
};

export function PluginList({ plugins }: { plugins: PluginRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const toggle = (slug: string, enabled: boolean) =>
    startTransition(async () => {
      const res = await togglePluginAction(slug, enabled);
      if (res.ok) {
        toast.success(enabled ? "Plugin enabled." : "Plugin disabled.");
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed.");
      }
    });

  return (
    <div className="space-y-3">
      {plugins.map((p) => (
        <Card key={p.slug}>
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{p.name}</span>
                <Badge variant="outline">v{p.version}</Badge>
              </div>
              {p.description ? (
                <p className="text-muted-foreground text-sm">{p.description}</p>
              ) : null}
            </div>
            <Switch
              checked={p.isEnabled}
              disabled={pending}
              onCheckedChange={(v) => toggle(p.slug, v)}
              aria-label={`Toggle ${p.name}`}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
