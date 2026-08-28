"use client";

import { useState, useTransition } from "react";
import { UUID } from "node:crypto";
import { CalendarClock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { reattributeOrderDay } from "@/lib/actions/order-actions";

const REASON_MIN_LENGTH = 10;

/**
 * Remedy for a finished sale that synced onto the wrong business day: move
 * the order (tenders and refunds included) onto its true day. Server-gated
 * on orders:approve_backdate; both days' cash-ups are recomputed by OMS.
 */
export function MoveOrderDayButton({
  orderId,
  orderNumber,
  currentBusinessDate,
  version,
}: {
  orderId: UUID;
  orderNumber: string;
  currentBusinessDate: string | null;
  version?: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [businessDate, setBusinessDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fiscalNote, setFiscalNote] = useState(false);
  const [pending, startTransition] = useTransition();

  // Cap the picker at yesterday in the browser's local day. The server is
  // the source of truth for the real location-timezone window (up to the
  // location's maxBackdateDays), so this is just a friendly client-side
  // guard against picking "today" or the future.
  const maxDate = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  const reasonValid = reason.trim().length >= REASON_MIN_LENGTH;
  const dateValid =
    businessDate.length > 0 && businessDate !== currentBusinessDate;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      // Fresh form every time the dialog is opened, including reopening
      // after a prior move.
      setBusinessDate("");
      setReason("");
      setError(null);
      setFiscalNote(false);
    }
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await reattributeOrderDay(orderId, {
        businessDate,
        reason: reason.trim(),
        expectedVersion: version,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setFiscalNote(result.fiscalReceiptKeepsOriginalDate);
      if (!result.fiscalReceiptKeepsOriginalDate) {
        setOpen(false);
      }
      router.refresh();
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => handleOpenChange(true)}
      >
        <CalendarClock className="mr-1.5 h-4 w-4" />
        Move to correct day
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Move to correct day</DialogTitle>
            <DialogDescription asChild>
              <p>
                Move order #{orderNumber} — its tenders and refunds included
                — onto its true business day. Both days&apos; cash-ups are
                recomputed.
              </p>
            </DialogDescription>
          </DialogHeader>

          {fiscalNote ? (
            <div className="flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400">
              <span>
                Moved. Note: the fiscal (VFD) receipt keeps its original
                date — only reporting and cash-up attribution changed.
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="move-order-day-date">
                  Correct business date
                </Label>
                <Input
                  id="move-order-day-date"
                  type="date"
                  max={maxDate}
                  value={businessDate}
                  onChange={(e) => setBusinessDate(e.target.value)}
                  disabled={pending}
                />
                {currentBusinessDate && (
                  <p className="text-xs text-muted-foreground">
                    Currently attributed to {currentBusinessDate}.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="move-order-day-reason">Reason</Label>
                <Textarea
                  id="move-order-day-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why is this order being moved to a different day?"
                  rows={3}
                  disabled={pending}
                />
                <p className="text-xs text-muted-foreground">
                  At least 10 characters — this lands on the order&apos;s
                  audit timeline.
                </p>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            {fiscalNote ? (
              <Button type="button" size="sm" onClick={() => setOpen(false)}>
                Close
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={submit}
                disabled={!dateValid || !reasonValid || pending}
              >
                {pending && (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                )}
                {pending ? "Moving…" : "Move order"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
