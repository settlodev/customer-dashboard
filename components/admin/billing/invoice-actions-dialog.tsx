"use client";

import { useEffect, useState, useTransition } from "react";
import { CheckCircle2, Loader2, RotateCcw, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

import { IssueRefundDialog } from "@/components/admin/billing/issue-refund-dialog";
import { RecordPaymentDialog } from "@/components/admin/billing/record-payment-dialog";

import {
  cancelSupportInvoice,
  listInvoiceRefunds,
  processRefund,
  rejectRefund,
} from "@/lib/actions/admin/billing";
import {
  InvoiceResponse,
  InvoiceStatus,
  RefundResponse,
  RefundStatus,
} from "@/types/admin/billing";

interface InvoiceActionsDialogProps {
  businessId: string;
  invoice: InvoiceResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

const INVOICE_STATUS_BADGE: Record<
  InvoiceStatus,
  { label: string; className: string }
> = {
  DRAFT: { label: "Draft", className: "border-muted bg-muted text-muted-foreground" },
  PENDING: {
    label: "Pending",
    className:
      "border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20",
  },
  PAID: {
    label: "Paid",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
  },
  FAILED: {
    label: "Failed",
    className:
      "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "border-muted bg-muted text-muted-foreground",
  },
  REFUNDED: {
    label: "Refunded",
    className:
      "border-violet-200 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20",
  },
};

const REFUND_BADGE: Record<RefundStatus, { label: string; className: string }> = {
  PENDING: {
    label: "Pending",
    className:
      "border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20",
  },
  APPROVED: {
    label: "Approved",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
  },
  REJECTED: {
    label: "Rejected",
    className:
      "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
  },
};

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export function InvoiceActionsDialog({
  businessId,
  invoice,
  open,
  onOpenChange,
  onChanged,
}: InvoiceActionsDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [busyRefundId, setBusyRefundId] = useState<string | null>(null);
  const [refunds, setRefunds] = useState<RefundResponse[]>([]);
  const [refundsLoading, setRefundsLoading] = useState(false);
  const [refundsError, setRefundsError] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setRefundsLoading(true);
    setRefundsError(null);
    listInvoiceRefunds(invoice.id)
      .then((list) => {
        if (cancelled) return;
        setRefunds(list);
      })
      .catch((err: any) => {
        if (cancelled) return;
        setRefundsError(err?.message ?? "Failed to load refund history.");
      })
      .finally(() => {
        if (!cancelled) setRefundsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, invoice.id]);

  const handleCancel = () => {
    if (!confirm("Cancel this PENDING invoice? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await cancelSupportInvoice(businessId, invoice.id);
      if (result.responseType === "error") {
        toast({
          title: "Failed to cancel invoice",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: result.message });
      onChanged();
      onOpenChange(false);
    });
  };

  const handleRefundAction = (
    refundId: string,
    kind: "approve" | "reject",
  ) => {
    if (busyRefundId) return;
    setBusyRefundId(refundId);
    startTransition(async () => {
      const fn = kind === "approve" ? processRefund : rejectRefund;
      const result = await fn(businessId, refundId);
      setBusyRefundId(null);
      if (result.responseType === "error") {
        toast({
          title:
            kind === "approve"
              ? "Failed to approve refund"
              : "Failed to reject refund",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: result.message });
      // Refresh refunds list locally and let parent revalidate
      try {
        const next = await listInvoiceRefunds(invoice.id);
        setRefunds(next);
      } catch {
        // ignore — toast already shown
      }
      onChanged();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Invoice {invoice.invoiceNumber}</span>
            <Badge
              variant="outline"
              className={INVOICE_STATUS_BADGE[invoice.status].className}
            >
              {INVOICE_STATUS_BADGE[invoice.status].label}
            </Badge>
          </DialogTitle>
          <DialogDescription className="font-mono text-[12px]">
            Issued {formatDate(invoice.invoiceDate)} · Total{" "}
            {formatMoney(invoice.totalAmount)}
          </DialogDescription>
        </DialogHeader>

        {/* Line items */}
        <div className="overflow-hidden rounded-md border border-line">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lineItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    No line items.
                  </TableCell>
                </TableRow>
              ) : (
                invoice.lineItems.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="text-[13px]">
                      {line.description}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {line.type}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {line.quantity}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(line.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatMoney(line.amount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Totals */}
        <div className="space-y-1 text-right font-mono text-[12px]">
          <p className="text-muted-foreground">
            Subtotal: <span className="text-ink">{formatMoney(invoice.subtotal)}</span>
          </p>
          {invoice.discountAmount > 0 && (
            <p className="text-muted-foreground">
              Discount: <span className="text-pos">−{formatMoney(invoice.discountAmount)}</span>
            </p>
          )}
          {invoice.taxAmount > 0 && (
            <p className="text-muted-foreground">
              Tax: <span className="text-ink">{formatMoney(invoice.taxAmount)}</span>
            </p>
          )}
          <p className="text-[13px] font-semibold text-ink">
            Total: {formatMoney(invoice.totalAmount)}
          </p>
        </div>

        {/* Refunds */}
        <div className="space-y-2">
          <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Refund history
          </h4>
          {refundsError ? (
            <p className="text-sm text-destructive">{refundsError}</p>
          ) : refundsLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading refunds…
            </p>
          ) : refunds.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No refunds requested for this invoice.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {refunds.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-line/60 bg-canvas/40 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[13px]">
                      <Badge
                        variant="outline"
                        className={REFUND_BADGE[r.status]?.className}
                      >
                        {REFUND_BADGE[r.status]?.label ?? r.status}
                      </Badge>
                      <span className="tabular-nums font-medium">
                        {formatMoney(r.amount)}
                      </span>
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {r.reason}
                    </p>
                  </div>
                  {r.status === "PENDING" && (
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={busyRefundId === r.id || isPending}
                        onClick={() => handleRefundAction(r.id, "approve")}
                        className="text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                      >
                        {busyRefundId === r.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={busyRefundId === r.id || isPending}
                        onClick={() => handleRefundAction(r.id, "reject")}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter className="flex-wrap gap-2">
          {invoice.status === "PENDING" && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaymentOpen(true)}
                disabled={isPending}
              >
                Record manual payment
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isPending}
                className="text-destructive hover:bg-destructive/10"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Cancel invoice"
                )}
              </Button>
            </>
          )}
          {invoice.status === "PAID" && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setRefundOpen(true)}
              disabled={isPending}
            >
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Issue refund
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>

        {/* Sub-dialogs */}
        <RecordPaymentDialog
          businessId={businessId}
          invoice={invoice}
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          onRecorded={() => {
            onChanged();
            onOpenChange(false);
          }}
        />
        <IssueRefundDialog
          businessId={businessId}
          invoice={invoice}
          open={refundOpen}
          onOpenChange={setRefundOpen}
          onCreated={async () => {
            try {
              const next = await listInvoiceRefunds(invoice.id);
              setRefunds(next);
            } catch {
              // ignore — list will refresh on next open
            }
            onChanged();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
