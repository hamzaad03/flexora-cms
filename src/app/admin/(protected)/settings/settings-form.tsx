"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { saveSettingsAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type SettingsValues = {
  "identity.title": string;
  "identity.tagline": string;
  "identity.logo": string;
  "identity.favicon": string;
  "integrations.ga": string;
  "integrations.gsc": string;
  "integrations.clarity": string;
  "analytics.enabled": boolean;
  "forms.turnstile.site": string;
  "forms.turnstile.secret": string;
};

export function SettingsForm({ initial }: { initial: SettingsValues }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [v, setV] = useState<SettingsValues>(initial);

  const set = <K extends keyof SettingsValues>(
    key: K,
    value: SettingsValues[K],
  ) => setV((p) => ({ ...p, [key]: value }));

  const save = () =>
    startTransition(async () => {
      const res = await saveSettingsAction(v);
      if (res.ok) {
        toast.success("Settings saved.");
        router.refresh();
      } else toast.error(res.error ?? "Failed.");
    });

  const text = (
    key: keyof SettingsValues,
    label: string,
    placeholder?: string,
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        value={v[key] as string}
        placeholder={placeholder}
        onChange={(e) => set(key, e.target.value)}
      />
    </div>
  );

  return (
    <div className="max-w-xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Site identity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {text("identity.title", "Site title")}
          {text("identity.tagline", "Tagline")}
          {text("identity.logo", "Logo URL")}
          {text("identity.favicon", "Favicon URL")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Analytics & integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center justify-between text-sm">
            Native analytics
            <Switch
              checked={v["analytics.enabled"]}
              onCheckedChange={(c) => set("analytics.enabled", c)}
            />
          </label>
          {text("integrations.ga", "Google Analytics ID", "G-XXXXXXXXXX")}
          {text(
            "integrations.gsc",
            "Search Console verification",
            "verification token",
          )}
          {text("integrations.clarity", "Microsoft Clarity ID")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Forms — Cloudflare Turnstile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {text("forms.turnstile.site", "Site key (public)")}
          {text("forms.turnstile.secret", "Secret key")}
          <p className="text-muted-foreground text-xs">
            Required only for forms with CAPTCHA enabled. Honeypot, time-trap,
            and rate-limiting protect every form regardless.
          </p>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        Save settings
      </Button>
    </div>
  );
}
