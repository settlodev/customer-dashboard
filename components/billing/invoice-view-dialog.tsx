"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Ban,
  CheckCircle2,
  FileText,
  Loader2,
  Wallet,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cancelInvoice, getInvoiceView } from "@/lib/actions/billing-actions";
import { formatMoney } from "@/lib/helpers";
import { formatBillingDate, getInvoiceStatusMeta } from "./shared";
import { PaymentOptionsDialog } from "./payment-options-dialog";
import type { InvoiceViewDto } from "@/types/billing/types";

interface InvoiceViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string | null;
  /** Business owning the invoice — required to start a payment. */
  businessId?: string;
  /** Location to charge against — required to start a payment. */
  locationId?: string;
  /** Pre-fill phone for the mobile-money push. */
  defaultPhone?: string;
  /** Pre-fill email for the receipt. */
  defaultEmail?: string;
  /** Fired once the invoice is paid. Callers that need to react specifically
   *  to payment (e.g., retry a store creation after payment) should use this. */
  onPaid?: () => void;
  /** Fired once the invoice is cancelled. */
  onCancelled?: () => void;
}

export function InvoiceViewDialog({
  open,
  onOpenChange,
  invoiceId,
  businessId,
  locationId,
  defaultPhone,
  defaultEmail,
  onPaid,
  onCancelled,
}: InvoiceViewDialogProps) {
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<InvoiceViewDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const loadInvoice = useCallback(async () => {
    if (!invoiceId) return;
    setLoading(true);
    try {
      const data = await getInvoiceView(invoiceId);
      setInvoice(data);
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    if (!open || !invoiceId) {
      setInvoice(null);
      setPayOpen(false);
      setConfirmCancelOpen(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getInvoiceView(invoiceId)
      .then((data) => {
        if (!cancelled) setInvoice(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, invoiceId]);

  const statusMeta = invoice ? getInvoiceStatusMeta(invoice.status) : null;
  const isPending = invoice?.status === "PENDING";
  const canPay = isPending && !!businessId && !!locationId;

  const handleCancel = useCallback(async () => {
    if (!invoice) return;
    setCancelling(true);
    try {
      await cancelInvoice(invoice.id);
      toast({
        title: "Invoice cancelled",
        description: `${invoice.invoiceNumber} is no longer payable.`,
      });
      setConfirmCancelOpen(false);
      onOpenChange(false);
      onCancelled?.();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Couldn't cancel invoice",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setCancelling(false);
    }
  }, [invoice, onOpenChange, onCancelled, toast]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-2xl"
          overlayClassName="bg-foreground/30 backdrop-blur-sm"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              {invoice ? `Invoice ${invoice.invoiceNumber}` : "Invoice"}
            </DialogTitle>
            <DialogDescription>
              {invoice
                ? `Issued ${formatBillingDate(invoice.invoiceDate)}`
                : "Loading details…"}
            </DialogDescription>
          </DialogHeader>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {invoice && !loading && (
            <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {statusMeta && (
                  <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                )}
                <div className="text-right">
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                    Total
                  </p>
                  <p className="text-xl font-semibold tabular-nums text-ink">
                    {formatMoney(invoice.totalAmount, invoice.currency)}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                    Period
                  </p>
                  <p className="mt-0.5 text-ink">
                    {formatBillingDate(invoice.periodStart)} –{" "}
                    {formatBillingDate(invoice.periodEnd)}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                    Due
                  </p>
                  <p className="mt-0.5 text-ink">
                    {formatBillingDate(invoice.dueDate)}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                    Billed to
                  </p>
                  <p className="mt-0.5 text-ink">{invoice.customerName || "—"}</p>
                  {invoice.customerEmail && (
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {invoice.customerEmail}
                    </p>
                  )}
                </div>
                <div>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                    From
                  </p>
                  <p className="mt-0.5 text-ink">{invoice.sellerName || "—"}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                  Line items
                </p>
                <div className="overflow-hidden rounded-lg border border-line">
                  <table className="w-full text-sm">
                    <thead className="bg-canvas font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left">Description</th>
                        <th className="px-3 py-2 text-right">Qty</th>
                        <th className="px-3 py-2 text-right">Unit</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {invoice.items.map((line) => (
                        <tr key={line.id}>
                          <td className="px-3 py-2 text-ink">
                            {line.description}
                            {line.isProration && (
                              <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">
                                (proration)
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {line.quantity}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {line.unitPrice.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums font-medium">
                            {line.totalPrice.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-1 rounded-lg border border-line bg-canvas px-4 py-3 text-sm">
                <Row
                  label="Subtotal"
                  value={formatMoney(invoice.subtotal, invoice.currency)}
                />
                {invoice.discountAmount > 0 && (
                  <Row
                    label={invoice.discountDescription ?? "Discount"}
                    value={`− ${formatMoney(invoice.discountAmount, invoice.currency)}`}
                    tone="pos"
                  />
                )}
                {invoice.taxAmount > 0 && (
                  <Row
                    label="Tax"
                    value={formatMoney(invoice.taxAmount, invoice.currency)}
                  />
                )}
                <Separator className="my-1" />
                <Row
                  label="Total"
                  value={formatMoney(invoice.totalAmount, invoice.currency)}
                  strong
                />
                {invoice.paidAt && (
                  <Row label="Paid at" value={formatBillingDate(invoice.paidAt)} />
                )}
              </div>

              {invoice.notes && (
                <p className="rounded-lg border border-line bg-canvas px-4 py-3 text-[12.5px] leading-relaxed text-muted-foreground">
                  {invoice.notes}
                </p>
              )}
            </div>
          )}

          {invoice && !loading && (
            <DialogFooter className="gap-2 sm:gap-2">
              {isPending ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-neg hover:bg-neg/10 hover:text-neg"
                    onClick={() => setConfirmCancelOpen(true)}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Cancel invoice
                  </Button>
                  <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                    >
                      Close
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setPayOpen(true)}
                      disabled={!canPay}
                      title={
                        canPay
                          ? undefined
                          : "Missing business or location context — try the billing tab."
                      }
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      Make payment
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {invoice.status === "PAID" && (
                    <span className="mr-auto inline-flex items-center gap-1.5 text-xs text-pos">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Paid
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Close
                  </Button>
                </>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {invoice && canPay && (
        <PaymentOptionsDialog
          open={payOpen}
          onOpenChange={setPayOpen}
          invoice={{
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.totalAmount,
            currency: invoice.currency,
          }}
          businessId={businessId!}
          locationId={locationId!}
          defaultEmail={defaultEmail ?? invoice.customerEmail ?? undefined}
          defaultPhone={defaultPhone ?? invoice.customerPhone ?? undefined}
          onPaid={() => {
            setPayOpen(false);
            void loadInvoice();
            onOpenChange(false);
            onPaid?.();
          }}
        />
      )}

      <AlertDialog
        open={confirmCancelOpen}
        onOpenChange={(o) => !cancelling && setConfirmCancelOpen(o)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Cancel invoice {invoice?.invoiceNumber}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This marks the invoice as cancelled. It can&apos;t be paid after
              that — generate a new invoice if you still need to settle this
              period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>
              Keep invoice
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleCancel();
              }}
              disabled={cancelling}
              className="bg-neg text-white hover:bg-neg/90"
            >
              {cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Row({
  label,
  value,
  tone,
  strong,
}: {
  label: string;
  value: string;
  tone?: "pos" | "neg";
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="font-mono text-[11.5px] text-muted-foreground">
        {label}
      </span>
      <span
        className={
          (strong ? "text-base font-semibold text-ink " : "text-sm text-ink ") +
          (tone === "pos" ? "text-pos " : tone === "neg" ? "text-neg " : "") +
          "tabular-nums"
        }
      >
        {value}
      </span>
    </div>
  );
}
