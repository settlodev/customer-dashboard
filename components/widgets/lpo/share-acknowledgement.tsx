"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Link as LinkIcon,
  Mail,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { acknowledgeLpo } from "@/lib/actions/lpo-actions";
import {
  type Lpo,
  type SupplierAcknowledgement,
  SUPPLIER_ACK_LABELS,
  SUPPLIER_ACK_TONES,
} from "@/types/lpo/type";
import type { Supplier } from "@/types/supplier/type";

interface Props {
  lpo: Lpo;
  supplier: Supplier | null;
}

export function LpoShareAcknowledgement({ lpo, supplier }: Props) {
  const [origin, setOrigin] = useState<string>("");
  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  const shareUrl = lpo.shareToken
    ? `${origin}/po/${lpo.shareToken}`
    : null;

  const supplierEmail = supplier?.email ?? null;
  const supplierMissingEmail = !supplierEmail;
  const ack = lpo.supplierAcknowledgement;

  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-base font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-gray-500" />
              Supplier acceptance
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              GRNs cannot be received against this LPO until the supplier
              accepts the order.
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${SUPPLIER_ACK_TONES[ack]}`}
          >
            {ack === "ACCEPTED" ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : ack === "REJECTED" ? (
              <XCircle className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
            {SUPPLIER_ACK_LABELS[ack]}
          </span>
        </div>

        {/* Share link block — only available once approved */}
        {shareUrl ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5" />
              Share with supplier
            </p>
            <div className="flex items-center gap-2">
              <Input value={shareUrl} readOnly className="font-mono text-xs" />
              <CopyButton text={shareUrl} />
              {supplierEmail && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="gap-1.5 shrink-0"
                >
                  <a
                    href={buildMailto(
                      supplierEmail,
                      lpo.lpoNumber,
                      shareUrl,
                      supplier?.name ?? "Supplier",
                    )}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </a>
                </Button>
              )}
            </div>
            {supplierMissingEmail && (
              <p className="text-xs text-amber-700 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                Add an email to the supplier profile to email this link in one
                click.
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            A share link will be generated once the LPO is approved.
          </p>
        )}

        {/* Acknowledged details */}
        {ack !== "PENDING" && (
          <div
            className={`rounded-lg border p-3 text-xs ${SUPPLIER_ACK_TONES[ack]}`}
          >
            <p className="font-semibold">
              {ack === "ACCEPTED" ? "Accepted" : "Rejected"}
              {lpo.acknowledgedAt &&
                ` on ${new Date(lpo.acknowledgedAt).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}`}
              {lpo.acknowledgedByStaffId
                ? " (recorded by staff)"
                : " (via share link)"}
            </p>
            {lpo.acknowledgementNote && (
              <p className="mt-1 whitespace-pre-wrap opacity-90">
                {lpo.acknowledgementNote}
              </p>
            )}
          </div>
        )}

        {/* Admin-side offline acknowledgement — only when APPROVED + PENDING */}
        {ack === "PENDING" && lpo.status === "APPROVED" && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
            <p className="text-xs text-muted-foreground flex-1 min-w-[180px]">
              Confirmed offline (phone, email, in-person)? Record it here.
            </p>
            <RecordAcknowledgementButton
              lpoId={lpo.id}
              decision="REJECTED"
              variant="outline"
            />
            <RecordAcknowledgementButton
              lpoId={lpo.id}
              decision="ACCEPTED"
              variant="default"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Copy to clipboard ───────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: "Link copied" });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({ variant: "destructive", title: "Couldn't copy" });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onCopy}
      className="gap-1.5 shrink-0"
    >
      {copied ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      Copy
    </Button>
  );
}

// ── Admin acknowledge dialog ────────────────────────────────────────

function RecordAcknowledgementButton({
  lpoId,
  decision,
  variant,
}: {
  lpoId: string;
  decision: Exclude<SupplierAcknowledgement, "PENDING">;
  variant: "default" | "outline";
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const isAccept = decision === "ACCEPTED";

  const onConfirm = () => {
    startTransition(() => {
      acknowledgeLpo(lpoId, {
        decision,
        note: note.trim() || undefined,
      }).then((res) => {
        if (res.responseType === "error") {
          toast({ variant: "destructive", title: res.message });
          return;
        }
        toast({ title: res.message });
        setOpen(false);
        setNote("");
        router.refresh();
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant={variant}
        size="sm"
        onClick={() => setOpen(true)}
        className={
          isAccept
            ? "gap-1.5"
            : "gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
        }
      >
        {isAccept ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : (
          <XCircle className="h-3.5 w-3.5" />
        )}
        {isAccept ? "Mark accepted" : "Mark rejected"}
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isAccept ? "Mark as accepted by supplier?" : "Mark as rejected by supplier?"}
          </DialogTitle>
          <DialogDescription>
            {isAccept
              ? "Use this only when the supplier has confirmed acceptance offline. Once recorded, GRNs can be received against this order."
              : "Records that the supplier declined this order. The LPO can be cancelled or re-sent after edits."}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={
            isAccept
              ? "Optional note (e.g. confirmed by phone, will deliver Friday)"
              : "Reason for rejection"
          }
          rows={3}
          maxLength={2000}
          disabled={pending}
        />
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={pending}
            variant={isAccept ? "default" : "destructive"}
          >
            {pending ? "Saving…" : isAccept ? "Confirm acceptance" : "Confirm rejection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function buildMailto(
  to: string,
  lpoNumber: string,
  shareUrl: string,
  supplierName: string,
): string {
  const subject = `Purchase Order ${lpoNumber}`;
  const body =
    `Hi ${supplierName},\n\n` +
    `Please review purchase order ${lpoNumber} at the link below. ` +
    `You can accept or reject it directly from there.\n\n` +
    `${shareUrl}\n\n` +
    `Thank you.`;
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
}
