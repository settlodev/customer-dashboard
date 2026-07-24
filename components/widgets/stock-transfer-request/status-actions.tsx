"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ThumbsDown,
  ThumbsUp,
  XCircle,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { NumericFormat } from "react-number-format";
import { useToast } from "@/hooks/use-toast";
import type { TransferRequest } from "@/types/stock-transfer-request/type";
import {
  approveTransferRequest,
  cancelTransferRequest,
  declineTransferRequest,
} from "@/lib/actions/stock-transfer-request-actions";

interface Props {
  request: TransferRequest;
  /**
   * The active destination's id (X-Location-Id). Decides which side of the
   * request the viewer is on:
   *   - id === request.sourceLocationId      → source (can Approve / Decline)
   *   - id === request.requestingLocationId  → requester (can Cancel)
   */
  activeDestinationId: string | null;
}

/**
 * Status-aware actions for a transfer request.
 *
 *   PENDING + source     → Approve (trim qty) / Decline (reason)
 *   PENDING + requester  → Cancel
 *   APPROVED (anyone)    → View transfer (the source dispatches it there)
 */
export function TransferRequestStatusActions({
  request,
  activeDestinationId,
}: Props) {
  const isSource =
    !!activeDestinationId && activeDestinationId === request.sourceLocationId;
  const isRequester =
    !!activeDestinationId &&
    activeDestinationId === request.requestingLocationId;

  const isPendingStatus = request.status === "PENDING";
  const showApprove = isPendingStatus && isSource;
  const showDecline = isPendingStatus && isSource;
  const showCancel = isPendingStatus && isRequester;
  const showViewTransfer =
    request.status === "APPROVED" && !!request.resultingTransferId;

  if (!showApprove && !showDecline && !showCancel && !showViewTransfer) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showApprove && <ApproveButton request={request} />}
      {showDecline && <DeclineButton id={request.id} />}
      {showCancel && <CancelButton id={request.id} />}
      {showViewTransfer && (
        <Button asChild variant="outline">
          <Link href={`/stock-transfers/${request.resultingTransferId}`}>
            <ArrowUpRight className="h-4 w-4 mr-1.5" /> View transfer
          </Link>
        </Button>
      )}
    </div>
  );
}

// ── Decline ──────────────────────────────────────────────────────────

function DeclineButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const onConfirm = () => {
    startTransition(async () => {
      try {
        await declineTransferRequest(id, reason.trim() || undefined);
        toast({ title: "Request declined" });
        setOpen(false);
        router.refresh();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Couldn't decline",
          description: error?.message ?? "Request failed",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-red-600 hover:bg-red-50">
          <ThumbsDown className="h-4 w-4 mr-1.5" /> Decline
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Decline this request</DialogTitle>
          <DialogDescription>
            The requester will be notified. No stock leaves your location.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-sm font-medium">Reason (optional)</label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this request being declined?"
            rows={3}
            disabled={isPending}
          />
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Keep
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Decline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Cancel ───────────────────────────────────────────────────────────

function CancelButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const onConfirm = () => {
    startTransition(async () => {
      try {
        await cancelTransferRequest(id);
        toast({ title: "Request withdrawn" });
        setOpen(false);
        router.refresh();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Couldn't cancel",
          description: error?.message ?? "Request failed",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost">
          <XCircle className="h-4 w-4 mr-1.5" /> Cancel request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw this request?</DialogTitle>
          <DialogDescription>
            The source will no longer see it in their approval inbox. This can&apos;t
            be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Keep
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Withdraw
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Approve — per-item editable quantities ───────────────────────────

// The most an approver can put on a line: never more than was requested, and
// never more than the source actually has on hand right now. Falls back to
// requestedQuantity alone when availability wasn't fetched (list-derived data).
const approvalCap = (item: TransferRequest["items"][number]): number =>
  item.availableQuantity != null
    ? Math.min(item.requestedQuantity, item.availableQuantity)
    : item.requestedQuantity;

function ApproveButton({ request }: { request: TransferRequest }) {
  const [open, setOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    request.items.forEach((item) => {
      initial[item.id] = approvalCap(item);
    });
    return initial;
  });

  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const totalApproving = useMemo(
    () => Object.values(quantities).reduce((s, q) => s + q, 0),
    [quantities],
  );

  // Clamp each line to 0..approvalCap — the backend rejects approvals above
  // the requested amount, and approving more than the source has on hand
  // would just fail once dispatched anyway.
  const setQty = (item: TransferRequest["items"][number], value: number) =>
    setQuantities((prev) => ({
      ...prev,
      [item.id]: Math.min(Math.max(0, value), approvalCap(item)),
    }));

  const onConfirm = () => {
    if (totalApproving <= 0) {
      toast({
        variant: "destructive",
        title: "Nothing to approve",
        description: "Approve at least one item with a quantity above zero.",
      });
      return;
    }
    const items = request.items.map((item) => ({
      stockVariantId: item.stockVariantId,
      approvedQuantity: quantities[item.id] ?? 0,
    }));
    startTransition(async () => {
      try {
        await approveTransferRequest(
          request.id,
          items,
          reviewNotes.trim() || undefined,
        );
        toast({ title: "Request approved — transfer created" });
        setOpen(false);
        router.refresh();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Couldn't approve",
          description: error?.message ?? "Request failed",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <ThumbsUp className="h-4 w-4 mr-1.5" /> Approve
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl flex flex-col max-h-[calc(100dvh-2rem)] overflow-y-hidden">
        <DialogHeader>
          <DialogTitle>Approve request {request.requestNumber}</DialogTitle>
          <DialogDescription>
            Trim any line if you can&apos;t fulfil it in full. Approving creates a
            stock transfer you then dispatch. Set a line to 0 to drop it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 flex-1 min-h-0 overflow-y-auto">
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/60">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                    Item
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">
                    Requested
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">
                    Available
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase w-36">
                    Approving
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {request.items.map((item) => {
                  const value = quantities[item.id] ?? 0;
                  return (
                    <tr key={item.id}>
                      <td className="px-3 py-2 font-medium">
                        {item.variantName}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {item.requestedQuantity.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right text-muted-foreground">
                        {item.availableQuantity != null
                          ? item.availableQuantity.toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <NumericFormat
                          customInput={Input}
                          value={value}
                          onValueChange={(v) =>
                            setQty(item, v.value ? Number(v.value) : 0)
                          }
                          thousandSeparator
                          decimalScale={6}
                          allowNegative={false}
                          disabled={isPending}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50/60 font-semibold">
                  <td colSpan={3} className="px-3 py-2 text-right">
                    Total approving
                  </td>
                  <td className="px-3 py-2 text-right">
                    {totalApproving.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div>
            <label className="text-xs font-medium">Review notes</label>
            <Textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={2}
              placeholder="Optional — note any trims or conditions…"
              disabled={isPending}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
