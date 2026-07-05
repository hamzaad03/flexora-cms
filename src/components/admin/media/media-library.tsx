"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, Trash2, Copy, Loader2 } from "lucide-react";

import {
  uploadMediaAction,
  updateMediaAction,
  deleteMediaAction,
} from "@/app/admin/(protected)/media/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type MediaItem = {
  id: string;
  url: string;
  mime: string;
  width: number | null;
  height: number | null;
  size: number;
  alt: string;
  caption: string;
};

function kb(n: number) {
  return n > 1024 * 1024
    ? `${(n / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(n / 1024)} KB`;
}

export function MediaLibrary({ items }: { items: MediaItem[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, startUpload] = useTransition();
  const [editing, setEditing] = useState<MediaItem | null>(null);

  const onFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    startUpload(async () => {
      const res = await uploadMediaAction(fd);
      if (res.ok) toast.success(`Uploaded ${res.count} file(s).`);
      else toast.error(res.error ?? "Upload failed.");
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
        <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          Upload
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">No media yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setEditing(m)}
              className="group overflow-hidden rounded-md border text-left"
            >
              <div className="bg-muted flex aspect-square items-center justify-center overflow-hidden">
                {m.mime.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.url}
                    alt={m.alt}
                    className="size-full object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <span className="text-muted-foreground text-xs uppercase">
                    {m.mime.split("/")[1] ?? "file"}
                  </span>
                )}
              </div>
              <div className="text-muted-foreground p-1.5 text-xs">
                {m.width && m.height ? `${m.width}×${m.height} · ` : ""}
                {kb(m.size)}
              </div>
            </button>
          ))}
        </div>
      )}

      {editing ? (
        <EditDialog
          key={editing.id}
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function EditDialog({
  item,
  onClose,
  onSaved,
}: {
  item: MediaItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [alt, setAlt] = useState(item.alt);
  const [caption, setCaption] = useState(item.caption);

  const save = () => {
    startTransition(async () => {
      const res = await updateMediaAction(item.id, { alt, caption });
      if (res.ok) {
        toast.success("Saved.");
        setAlt("");
        setCaption("");
        onSaved();
      } else toast.error(res.error ?? "Failed.");
    });
  };

  const remove = () => {
    if (!confirm("Delete this file?")) return;
    startTransition(async () => {
      const res = await deleteMediaAction(item.id);
      if (res.ok) {
        toast.success("Deleted.");
        onSaved();
      } else toast.error(res.error ?? "Failed.");
    });
  };

  return (
    <Dialog open onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Media details</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {item.mime.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.url}
              alt={item.alt}
              className="max-h-48 w-full rounded-md object-contain"
            />
          ) : null}
          <div className="flex items-center gap-2">
            <Input readOnly value={item.url} />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                navigator.clipboard.writeText(
                  window.location.origin + item.url,
                );
                toast.success("URL copied.");
              }}
              aria-label="Copy URL"
            >
              <Copy className="size-4" />
            </Button>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-alt">Alt text</Label>
            <Input
              id="m-alt"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-caption">Caption</Label>
            <Textarea
              id="m-caption"
              rows={2}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={remove}
            disabled={pending}
          >
            <Trash2 className="size-4" /> Delete
          </Button>
          <Button type="button" onClick={save} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
