import { requirePermission } from "@/server/auth/guard";
import { listMedia, mediaUrl } from "@/server/services/media";
import {
  MediaLibrary,
  type MediaItem,
} from "@/components/admin/media/media-library";

export const metadata = { title: "Media" };
export const dynamic = "force-dynamic";

export default async function MediaPage() {
  await requirePermission("media.view");
  const media = await listMedia();

  const items: MediaItem[] = media.map((m) => ({
    id: m.id,
    url: mediaUrl(m.path),
    mime: m.mime,
    width: m.width,
    height: m.height,
    size: m.size,
    alt: m.alt ?? "",
    caption: m.caption ?? "",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Media</h1>
        <p className="text-muted-foreground text-sm">
          Upload and manage images and files. Images are optimized on upload.
        </p>
      </div>
      <MediaLibrary items={items} />
    </div>
  );
}
