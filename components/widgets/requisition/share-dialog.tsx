"use client";

import { useState, useTransition } from "react";
import { Check, Copy, ExternalLink, Loader2, Share2, Trash2 } from "lucide-react";
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
import {
  revokeRequisitionShare,
  shareRequisition,
} from "@/lib/actions/requisition-actions";
import type { PurchaseRequisition } from "@/types/requisition/type";

const buildShareUrl = (token: string): string => {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/pr/${token}`;
  }
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  return `${base}/pr/${token}`;
};

export function RequisitionShareButton({
  requisition,
}: {
  requisition: PurchaseRequisition;
}) {
  const [open, setOpen] = useState(false);
  const [isMinting, startMint] = useTransition();
  const [isRevoking, startRevoke] = useTransition();
  const [token, setToken] = useState<string | null>(requisition.shareToken);
  const [copied, setCopied] = useState(false);

  const shareUrl = token ? buildShareUrl(token) : "";

  const handleOpen = () => {
    setOpen(true);
    if (!token) mintToken();
  };

  const mintToken = () => {
    startMint(async () => {
      const result = await shareRequisition(requisition.id);
      if ("error" in result) {
        toast({
          variant: "destructive",
          title: "Couldn't create share link",
          description: result.error,
        });
        setOpen(false);
        return;
      }
      setToken(result.shareToken);
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

  const handleRevoke = () => {
    if (!token) return;
    startRevoke(async () => {
      const result = await revokeRequisitionShare(requisition.id);
      if (result.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't revoke link",
          description: result.message,
        });
        return;
      }
      setToken(null);
      toast({ title: "Share link revoked" });
      setOpen(false);
    });
  };

  return (
    <>
      <Button onClick={handleOpen} variant="outline" size="sm">
        <Share2 className="mr-1.5 h-4 w-4" />
        Share
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share purchase requisition</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Anyone with this link can view{" "}
                  {requisition.requisitionNumber}.
                </p>
                <p>
                  Status reflects the latest state — if the requisition is
                  later cancelled or rejected, the link will show that.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          {isMinting || !token ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating share link…
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input readOnly value={shareUrl} className="font-mono text-xs" />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={handleCopy}
                  aria-label="Copy share link"
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
                  aria-label="Open share link"
                >
                  <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
              {requisition.shareTokenIssuedAt && (
                <p className="text-xs text-muted-foreground">
                  Link first issued{" "}
                  {new Date(requisition.shareTokenIssuedAt).toLocaleString(
                    "en-GB",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                  .
                </p>
              )}
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            {token && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRevoke}
                disabled={isRevoking}
              >
                {isRevoking ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-1.5 h-4 w-4" />
                )}
                Revoke link
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
