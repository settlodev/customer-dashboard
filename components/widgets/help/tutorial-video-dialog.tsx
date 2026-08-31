"use client";

import { PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function getYoutubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    let videoId: string | null = null;

    if (parsed.hostname.includes("youtu.be")) {
      videoId = parsed.pathname.slice(1);
    } else if (parsed.pathname.startsWith("/embed/")) {
      videoId = parsed.pathname.split("/embed/")[1];
    } else {
      videoId = parsed.searchParams.get("v");
    }

    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
}

interface TutorialVideoDialogProps {
  /** Dialog title, e.g. "How to record a stock intake". */
  title: string;
  /** Any standard YouTube watch/share/embed URL. */
  youtubeUrl: string;
  /** Optional short blurb shown under the title. */
  description?: string;
  /** Text on the trigger button. */
  triggerLabel?: string;
}

/**
 * Self-contained "watch tutorial" trigger + dialog. Drop it into a page's
 * header actions to give a section an in-context how-to video.
 */
export function TutorialVideoDialog({
  title,
  youtubeUrl,
  description,
  triggerLabel = "Watch tutorial",
}: TutorialVideoDialogProps) {
  const embedUrl = getYoutubeEmbedUrl(youtubeUrl);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <PlayCircle className="mr-1.5 h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="aspect-video w-full overflow-hidden rounded-md bg-black">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Video unavailable.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
