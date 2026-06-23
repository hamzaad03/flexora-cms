"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

import {
  activateThemeAction,
  deleteThemeAction,
  installStarterAction,
  uploadThemeAction,
  type ThemeActionState,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type ThemeView = {
  slug: string;
  name: string;
  version: string;
  author: string | null;
  isActive: boolean;
};

function notify(res: ThemeActionState) {
  if (res.error) toast.error(res.error);
  if (res.success) toast.success(res.success);
}

export function ThemeManager({ themes }: { themes: ThemeView[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  const run = (fn: () => Promise<ThemeActionState>) =>
    startTransition(async () => {
      const res = await fn();
      notify(res);
      router.refresh();
    });

  const onUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setUploading(true);
    startTransition(async () => {
      const res = await uploadThemeAction({}, fd);
      notify(res);
      setUploading(false);
      if (res.success) form.reset();
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload a theme</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={onUpload}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Input
              type="file"
              name="file"
              accept=".zip"
              required
              className="max-w-sm"
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={uploading || pending}>
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                Upload
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => run(installStarterAction)}
              >
                Reinstall starter
              </Button>
            </div>
          </form>
          <p className="text-muted-foreground mt-2 text-xs">
            A theme is a .zip containing <code>theme.json</code>, templates, and
            assets. Max 50MB.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {themes.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No themes installed yet.
          </p>
        ) : (
          themes.map((theme) => (
            <Card key={theme.slug}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{theme.name}</CardTitle>
                {theme.isActive ? <Badge>Active</Badge> : null}
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                <p>Version {theme.version}</p>
                {theme.author ? <p>by {theme.author}</p> : null}
                <p className="text-xs">{theme.slug}</p>
              </CardContent>
              <CardFooter className="gap-2">
                {!theme.isActive ? (
                  <>
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() => {
                        const fd = new FormData();
                        fd.set("slug", theme.slug);
                        run(() => activateThemeAction({}, fd));
                      }}
                    >
                      Activate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => {
                        const fd = new FormData();
                        fd.set("slug", theme.slug);
                        run(() => deleteThemeAction({}, fd));
                      }}
                    >
                      Delete
                    </Button>
                  </>
                ) : (
                  <span className="text-muted-foreground text-xs">
                    Currently serving your site
                  </span>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
