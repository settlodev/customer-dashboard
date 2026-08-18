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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  revokeDaySessionReportShare,
  shareDaySessionReport,
} from "@/lib/actions/day-session-share-actions";

/** Public URL for a Close-of-Day share token. Prefers the live origin. */
const buildShareUrl = (token: string): string => {
  if (typeof window !== "undefined") return `${window.location.origin}/cod/${token}`;
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  return `${base}/cod/${token}`;
};

const EXPIRY_OPTIONS = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "never", label: "No expiry" },
];

const fmtWhen = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * "Share" control on the session dashboard — mints an opaque public token
 * for the Close-of-Day report and hands back a `/cod/{token}` link that
 * anyone (owner, accountant) can open without logging in. The operator
 * picks an expiry before creating; revoke kills the link early. Mirrors
 * the GRN share dialog, with the added expiry step.
 */
export function CodShareButton({
  locationId,
  sessionId,
  label,
}: {
  locationId: string;
  sessionId: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [isMinting, startMint] = useTransition();
  const [isRevoking, startRevoke] = useTransition();
  const [token, setToken] = useState<string | null>(null);
  const [issuedAt, setIssuedAt] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [expiryChoice, setExpiryChoice] = useState("30");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareUrl = token ? buildShareUrl(token) : "";

  const createLink = () => {
    const expiresInDays = expiryChoice === "never" ? null : Number(expiryChoice);
    startMint(async () => {
      const result = await shareDaySessionReport(
        locationId,
        sessionId,
        expiresInDays,
      );
      if ("error" in result) {
        toast({
          variant: "destructive",
          title: "Couldn't create share link",
          description: result.error,
        });
        return;
      }
      setToken(result.shareToken);
      setIssuedAt(result.shareTokenIssuedAt);
      setExpiresAt(result.expiresAt);
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
      const result = await revokeDaySessionReportShare(locationId, sessionId);
      if (result.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't revoke link",
          description: result.message,
        });
        return;
      }
      setToken(null);
      setIssuedAt(null);
      setExpiresAt(null);
      toast({ title: "Share link revoked" });
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line-2 bg-card px-[13px] text-[13px] font-semibold text-ink-2 transition-colors hover:bg-canvas"
      >
        <Share2 className="h-[15px] w-[15px] text-ink-3" />
        <span className="hidden sm:inline">Share</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Close of Day report</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Anyone with this link can view the {label} report — no login
                  needed.
                </p>
                <p>
                  Choose how long it stays live. You can revoke it any time
                  before then.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          {isMinting ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating share link…
            </div>
          ) : token ? (
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
                    <Check className="h-4 w-4 text-pos" />
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
              <p className="text-xs text-muted-foreground">
                {expiresAt ? `Expires ${fmtWhen(expiresAt)}.` : "Never expires."}
                {issuedAt ? ` Issued ${fmtWhen(issuedAt)}.` : ""}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink-2">Link expiry</label>
              <Select value={expiryChoice} onValueChange={setExpiryChoice}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            {token ? (
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
            ) : (
              <Button type="button" onClick={createLink} disabled={isMinting}>
                {isMinting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Create link
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
