"use client";

import * as React from "react";
import {
  ArrowUpFromLine,
  ImageOff,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useUpload } from "@/lib/uploads/use-upload";
import { useImageFallback } from "@/components/ui/safe-image";
import type { UploadPurpose } from "@/lib/uploads/types";

/**
 * Single-image upload control that matches the product/stock form media zone:
 * a dashed drop target while empty, a framed preview with Replace / Remove
 * once an image is set, and an in-place progress overlay while the presigned
 * PUT is in flight. Controlled — the parent owns the URL, so it slots into a
 * react-hook-form `FormField` (`value` / `onChange`) or plain state.
 *
 * Built on the dashboard tokens (line-2, ink, canvas, primary) rather than the
 * product form's CSS module so it works anywhere, not just under `.formRoot`.
 */

const DEFAULT_ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";

export interface ImageDropzoneProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "onChange" | "defaultValue"
  > {
  /** Current image URL (controlled). */
  value?: string | null;
  /** Receives the uploaded URL, or `null` when the image is removed. */
  onChange: (url: string | null) => void;
  /** Routes the presign to the service that owns this kind of upload. */
  purpose: UploadPurpose;
  disabled?: boolean;
  /** Comma-separated MIME list for the picker and drop validation. */
  accept?: string;
  /** Client-side size ceiling in MB — mirror the backend purpose limit. */
  maxSizeMb?: number;
  /** Alt text for the preview image. */
  alt?: string;
  /** Format hint under the CTA, e.g. "PNG · JPG · WEBP · SVG". */
  spec?: string;
  /** Preview fit — logos read best as `contain`, photos as `cover`. */
  fit?: "contain" | "cover";
  /** Copy for the empty-state call to action. */
  ctaLabel?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileNameFromUrl(url: string): string {
  try {
    const last = new URL(url, "http://x").pathname.split("/").pop() ?? "";
    return decodeURIComponent(last) || "image";
  } catch {
    return "image";
  }
}

function extensionLabel(nameOrType: string): string {
  const ext = nameOrType.includes("/")
    ? nameOrType.split("/")[1]
    : nameOrType.split(".").pop();
  return (ext ?? "").replace("svg+xml", "svg").toUpperCase();
}

interface UploadedMeta {
  url: string;
  name: string;
  size: number;
  type: string;
}

export const ImageDropzone = React.forwardRef<HTMLDivElement, ImageDropzoneProps>(
  function ImageDropzone(
    {
      value,
      onChange,
      purpose,
      disabled = false,
      accept = DEFAULT_ACCEPT,
      maxSizeMb = 5,
      alt = "Uploaded image",
      spec = "PNG · JPG · WEBP · SVG",
      fit = "contain",
      ctaLabel = "Click to upload",
      className,
      ...rest
    },
    ref,
  ) {
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const [dragOver, setDragOver] = React.useState(false);
    // Name/size of the file we just uploaded — only meaningful while `value`
    // still points at that upload; an inherited URL has no local metadata.
    const [uploaded, setUploaded] = React.useState<UploadedMeta | null>(null);
    const { upload, isUploading, progress } = useUpload();
    const { failed, onError } = useImageFallback(value);

    const hasImage = !!value;
    const busy = disabled || isUploading;
    const acceptedTypes = React.useMemo(
      () =>
        accept
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
      [accept],
    );

    const validate = (file: File): string | null => {
      const type = file.type.toLowerCase();
      const accepted =
        acceptedTypes.length === 0 ||
        acceptedTypes.some((t) =>
          t.endsWith("/*") ? type.startsWith(t.slice(0, -1)) : t === type,
        );
      if (!accepted) return `Please choose a ${spec.replace(/ · /g, ", ")} file.`;
      if (file.size > maxSizeMb * 1024 * 1024)
        return `That file is ${formatBytes(file.size)}. The limit is ${maxSizeMb} MB.`;
      return null;
    };

    const handleFile = async (file: File | null | undefined) => {
      if (!file || busy) return;
      const problem = validate(file);
      if (problem) {
        toast({ variant: "destructive", title: "Can't use that file", description: problem });
        return;
      }
      try {
        const result = await upload({ file, purpose });
        setUploaded({ url: result.url, name: file.name, size: file.size, type: file.type });
        onChange(result.url);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description:
            error instanceof Error ? error.message : "Please try again.",
        });
      }
    };

    const openPicker = () => {
      if (busy) return;
      inputRef.current?.click();
    };

    const remove = () => {
      if (busy) return;
      setUploaded(null);
      onChange(null);
    };

    const meta = uploaded && uploaded.url === value ? uploaded : null;
    const fileName = value ? (meta?.name ?? fileNameFromUrl(value)) : "";
    const fileDetail = meta
      ? `${formatBytes(meta.size)} · ${extensionLabel(meta.type)}`
      : value
        ? extensionLabel(fileName) || "IMAGE"
        : "";

    return (
      <div
        ref={ref}
        data-disabled={disabled ? "" : undefined}
        className={cn(
          "relative flex min-h-[184px] w-full flex-col overflow-hidden rounded-[10px] border-[1.5px] bg-card transition-[border-color,background-color,box-shadow]",
          hasImage ? "border-solid border-line" : "border-dashed border-line-2",
          !hasImage && !busy && "hover:border-primary hover:bg-primary/[0.06]",
          dragOver && "border-solid border-primary bg-primary/10 ring-[3px] ring-primary/15",
          disabled && "opacity-60",
          className,
        )}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFile(e.dataTransfer.files?.[0]);
        }}
        {...rest}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            // Reset so picking the same file again re-fires onChange.
            e.target.value = "";
            void handleFile(file);
          }}
        />

        {hasImage ? (
          <>
            <div className="relative flex min-h-[120px] flex-1 items-center justify-center bg-canvas p-4">
              {failed ? (
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-card text-muted-foreground">
                    <ImageOff className="h-5 w-5" />
                  </span>
                  <span className="text-[12px] text-ink-2">
                    Preview unavailable
                  </span>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- upload host isn't in next/image remotePatterns
                <img
                  src={value ?? undefined}
                  alt={alt}
                  onError={onError}
                  className={cn(
                    fit === "cover"
                      ? "absolute inset-0 h-full w-full object-cover"
                      : "max-h-44 max-w-full rounded-md object-contain",
                  )}
                />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-line bg-card px-3 py-2">
              <div className="min-w-0 flex-1 basis-[120px]">
                <p className="truncate text-[12px] font-medium text-ink" title={fileName}>
                  {fileName}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-muted-foreground">
                  {fileDetail}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openPicker}
                  disabled={busy}
                  aria-label="Replace image"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Replace</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={remove}
                  disabled={busy}
                  aria-label="Remove image"
                  className="text-neg hover:bg-neg-tint hover:text-neg"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove</span>
                </Button>
              </div>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={openPicker}
            disabled={busy}
            className="group flex flex-1 flex-col items-center justify-center gap-1.5 p-6 text-center outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25 disabled:cursor-not-allowed"
          >
            <span className="mb-1 grid h-11 w-11 place-items-center rounded-xl bg-canvas text-muted-foreground transition-colors group-hover:text-primary">
              <ArrowUpFromLine className="h-5 w-5" />
            </span>
            <span className="text-[13px] text-ink-2">
              <b className="font-medium text-primary">{ctaLabel}</b>
              <span className="hidden sm:inline"> or drag &amp; drop</span>
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
              {spec} · {maxSizeMb}MB
            </span>
          </button>
        )}

        {isUploading && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-card/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="font-mono text-[11px] text-ink-2">
                {progress ? `${progress.percent}%` : "Uploading…"}
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-line">
              <div
                className="h-full bg-primary transition-[width] duration-150"
                style={{ width: `${progress?.percent ?? 0}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  },
);

export default ImageDropzone;
