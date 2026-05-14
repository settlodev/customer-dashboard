"use client";

import { UUID } from "node:crypto";
import { useState, useTransition } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCcw,
  Share2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { createReceiptSnapshot } from "@/lib/actions/order-actions";

const buildShareUrl = (slug: string): string => {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/r/${slug}`;
  }
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  return `${base}/r/${slug}`;
};

const formatTs = (iso: string | null | undefined): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function OrderReceiptShareButton({
  orderId,
  orderNumber,
}: {
  orderId: UUID;
  orderNumber: string;
}) {
  const [open, setOpen] = useState(false);
  const [isMinting, startMint] = useTransition();
  const [slug, setSlug] = useState<string | null>(null);
  const [snapshotAt, setSnapshotAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const shareUrl = slug ? buildShareUrl(slug) : "";

  const handleOpen = () => {
    setOpen(true);
    if (!slug) mintSnapshot();
  };

  const mintSnapshot = () => {
    startMint(async () => {
      const result = await createReceiptSnapshot(orderId);
      if ("error" in result) {
        toast({
          variant: "destructive",
          title: "Couldn't create receipt",
          description: result.error,
        });
        setOpen(false);
        return;
      }
      setSlug(result.snapshot.snapshotSlug);
      setSnapshotAt(result.snapshot.snapshotCreatedAt);
    });
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast({ title: "Link copied to clipboard" });
    } catch {
      toast({
        variant: "destructive",
        title: "Couldn't copy link",
        description: "Please copy the link manually.",
      });
    }
  };

  return (
    <>
      <Button onClick={handleOpen} variant="outline" size="sm">
        <Share2 className="mr-1.5 h-4 w-4" />
        Share receipt
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share receipt</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Snapshot of order #{orderNumber} — captures the current
                  totals, payments and items in an immutable receipt.
                </p>
                <p className="flex items-start gap-1.5 text-muted-foreground">
                  <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    Frozen at the moment you generated it; later changes
                    won&apos;t appear. Generate a fresh one if more
                    payments come in.
                  </span>
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          {isMinting || !slug ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating receipt snapshot…
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={shareUrl}
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={handleCopy}
                  aria-label="Copy receipt link"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  asChild
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label="Open receipt"
                >
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
              {snapshotAt && (
                <p className="text-xs text-muted-foreground">
                  Captured {formatTs(snapshotAt)} · expires after 90 days.
                </p>
              )}
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            {slug && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={mintSnapshot}
                disabled={isMinting}
              >
                {isMinting ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="mr-1.5 h-4 w-4" />
                )}
                Generate new snapshot
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
