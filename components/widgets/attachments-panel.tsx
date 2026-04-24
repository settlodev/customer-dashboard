"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  Paperclip,
  Upload,
  Download,
  Trash2,
  Loader2,
  FileText,
  Image as ImageIcon,
  FileArchive,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type {
  Attachment,
  AttachmentEntityType,
} from "@/types/attachment/type";
import { ATTACHMENT_MAX_BYTES } from "@/types/attachment/type";
import {
  listAttachments,
  uploadAttachment,
  deleteAttachment,
  getAttachmentDownloadHref,
  getAttachmentSaveHref,
} from "@/lib/actions/attachment-actions";

interface Props {
  entityType: AttachmentEntityType;
  entityId: string;
  /** Override the default "Attachments" section title. */
  title?: string;
  /** Override the default helper text under the title. */
  description?: string;
  /** Hide the upload controls for read-only surfaces. */
  readOnly?: boolean;
  /** MIME prefix filter — defaults to everything. e.g. "image/*,application/pdf". */
  accept?: string;
}

export function AttachmentsPanel({
  entityType,
  entityId,
  title = "Attachments",
  description = "Delivery notes, invoice scans, signed documents, or photos. Max 10 MB per file.",
  readOnly = false,
  accept,
}: Props) {
  const [items, setItems] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, startUpload] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<Attachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  const refresh = useCallback(async () => {
    setLoading(true);
    setItems(await listAttachments(entityType, entityId));
    setLoading(false);
  }, [entityType, entityId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onPick = () => fileInputRef.current?.click();

  const onFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > ATTACHMENT_MAX_BYTES) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: `${formatBytes(file.size)} exceeds the 10 MB limit.`,
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    startUpload(async () => {
      const res = await uploadAttachment(entityType, entityId, formData);
      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: res.message,
        });
        return;
      }
      toast({ title: "Uploaded", description: file.name });
      refresh();
    });

    // Clear the input so picking the same file again still fires onChange.
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onDelete = (attachment: Attachment) => {
    setDeletingId(attachment.id);
    startDelete(async () => {
      const res = await deleteAttachment(attachment.id, entityType);
      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Remove failed",
          description: res.message,
        });
        setDeletingId(null);
        return;
      }
      toast({ title: "Removed", description: attachment.originalFileName ?? attachment.fileName });
      setDeletingId(null);
      refresh();
    });
  };

  const openDownload = async (attachment: Attachment) => {
    const href = await getAttachmentSaveHref(attachment);
    window.open(href, "_blank", "noopener,noreferrer");
  };

  // ── Drag & drop ─────────────────────────────────────────────────
  const [isDragOver, setIsDragOver] = useState(false);
  const onDragOver = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDragOver(true);
  };
  const onDragLeave = () => setIsDragOver(false);
  const onDrop = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDragOver(false);
    onFiles(e.dataTransfer.files);
  };

  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              {title}
              {items.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground">
                  ({items.length})
                </span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
          {!readOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onPick}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5 mr-1.5" />
              )}
              Upload
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={accept}
            onChange={(e) => onFiles(e.target.files)}
          />
        </div>

        {!readOnly && (
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={onPick}
            className={`rounded-md border-2 border-dashed px-4 py-6 text-center text-xs cursor-pointer transition-colors ${
              isDragOver
                ? "border-primary bg-primary/5 text-primary"
                : "border-gray-200 hover:border-gray-300 text-muted-foreground"
            }`}
          >
            {isUploading ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Uploading…
              </span>
            ) : (
              <>
                <span className="font-medium">Click to upload</span> or drag a file in
              </>
            )}
          </div>
        )}

        {loading ? (
          <div className="py-6 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-xs text-muted-foreground italic text-center py-2">
            No files uploaded yet.
          </p>
        ) : (
          <ul className="divide-y rounded-md border">
            {items.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50/50"
              >
                <FileIcon contentType={a.contentType} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">
                    {a.originalFileName ?? a.fileName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatBytes(a.fileSize)} · {formatDate(a.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {isPreviewable(a.contentType) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPreviewing(a)}
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openDownload(a)}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:bg-red-50"
                      onClick={() => onDelete(a)}
                      disabled={isDeleting && deletingId === a.id}
                      title="Remove"
                    >
                      {isDeleting && deletingId === a.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {previewing && (
        <PreviewDialog
          attachment={previewing}
          onClose={() => setPreviewing(null)}
        />
      )}
    </Card>
  );
}

function PreviewDialog({
  attachment,
  onClose,
}: {
  attachment: Attachment;
  onClose: () => void;
}) {
  const [href, setHref] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    getAttachmentDownloadHref(attachment).then((h) => {
      if (!cancelled) setHref(h);
    });
    return () => {
      cancelled = true;
    };
  }, [attachment]);

  const isImage = (attachment.contentType ?? "").startsWith("image/");
  const isPdf = attachment.contentType === "application/pdf";

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate">
            {attachment.originalFileName ?? attachment.fileName}
          </DialogTitle>
        </DialogHeader>
        <div className="bg-gray-50 rounded-md overflow-hidden">
          {href ? (
            isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={href}
                alt={attachment.originalFileName ?? attachment.fileName}
                className="w-full max-h-[70vh] object-contain bg-white"
              />
            ) : isPdf ? (
              <iframe
                src={href}
                className="w-full h-[70vh] bg-white"
                title={attachment.originalFileName ?? attachment.fileName}
              />
            ) : (
              <div className="py-20 text-center text-sm text-muted-foreground">
                No inline preview for this file type.
              </div>
            )
          ) : (
            <div className="py-20 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Close
          </Button>
          {href && (
            <Button asChild>
              <a href={href} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-1.5" /> Download
              </a>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Helpers ────────────────────────────────────────────────────────

function FileIcon({ contentType }: { contentType: string | null }) {
  const cls = "h-5 w-5 text-muted-foreground shrink-0";
  if (!contentType) return <FileText className={cls} />;
  if (contentType.startsWith("image/")) return <ImageIcon className={cls} />;
  if (contentType.includes("zip") || contentType.includes("compressed"))
    return <FileArchive className={cls} />;
  return <FileText className={cls} />;
}

function isPreviewable(contentType: string | null | undefined): boolean {
  if (!contentType) return false;
  return contentType.startsWith("image/") || contentType === "application/pdf";
}

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || Number.isNaN(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
