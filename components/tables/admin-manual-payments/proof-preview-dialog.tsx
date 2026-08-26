"use client";

import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getManualPaymentProofHref,
  getManualPaymentProofSaveHref,
} from "@/lib/actions/admin/billing";
import { ManualPaymentResponse } from "@/types/admin/billing";

/**
 * Manual payments don't store a content type (unlike inventory attachments),
 * so the preview mode is inferred from the stored file's extension — the
 * same extension the backend itself derives Content-Type from.
 */
function inferProofKind(storagePath: string | null): "image" | "pdf" | "other" {
  if (!storagePath) return "other";
  const ext = storagePath.split(".").pop()?.toLowerCase();
  if (!ext) return "other";
  if (["png", "jpg", "jpeg", "gif", "webp", "heic", "heif", "bmp"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  return "other";
}

export function ProofPreviewDialog({
  payment,
  onClose,
}: {
  payment: ManualPaymentResponse;
  onClose: () => void;
}) {
  const [href, setHref] = useState<string | null>(null);
  const [saveHref, setSaveHref] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getManualPaymentProofHref(payment),
      getManualPaymentProofSaveHref(payment),
    ]).then(([viewHref, downloadHref]) => {
      if (cancelled) return;
      setHref(viewHref);
      setSaveHref(downloadHref);
    });
    return () => {
      cancelled = true;
    };
  }, [payment]);

  const kind = inferProofKind(payment.proofStoragePath);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate">
            Payment proof — {payment.invoiceNumber ?? payment.invoiceId}
          </DialogTitle>
        </DialogHeader>
        <div className="bg-gray-50 rounded-md overflow-hidden">
          {href ? (
            kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={href}
                alt={`Payment proof for invoice ${payment.invoiceNumber ?? payment.invoiceId}`}
                className="w-full max-h-[70vh] object-contain bg-white"
              />
            ) : kind === "pdf" ? (
              <iframe
                src={href}
                className="w-full h-[70vh] bg-white"
                title={`Payment proof for invoice ${payment.invoiceNumber ?? payment.invoiceId}`}
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
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          {saveHref && (
            <Button asChild>
              <a href={saveHref} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-1.5" /> Download
              </a>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
