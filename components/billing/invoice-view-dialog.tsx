"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Ban,
  CheckCircle2,
  Loader2,
  Wallet,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
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
  AlertDialogIcon,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  cancelInvoice,
  getInvoiceBillingParties,
  getInvoiceView,
} from "@/lib/actions/billing-actions";
import { StatusPill, toPillTone } from "./pill";
import {
  buildBillToParty,
  formatAmount,
  formatBillingDate,
  getInvoiceStatusMeta,
  type InvoiceParty,
} from "./shared";
import { PaymentOptionsDialog } from "./payment-options-dialog";
import {
  hasBlockingPayment,
  InvoicePaymentAttempts,
} from "./invoice-payment-attempts";
import { listInvoicePayments } from "@/lib/actions/payment-actions";
import type { InvoiceStatus, InvoiceViewDto, PaymentResponse } from "@/types/billing/types";

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

/** Eyebrow above the invoice number — tells you at a glance what you're reading. */
const DOC_LABEL: Partial<Record<InvoiceStatus, string>> = {
  PENDING: "Invoice · due",
  PAID: "Invoice · receipt",
  CANCELLED: "Cancelled invoice",
  REFUNDED: "Refunded invoice",
  FAILED: "Invoice · payment failed",
  DRAFT: "Draft invoice",
};

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
  /** Bumps after each payment attempt resolves so the attempts list refetches. */
  const [attemptsRefreshKey, setAttemptsRefreshKey] = useState(0);
  const [billTo, setBillTo] = useState<InvoiceParty | null>(null);
  const [attempts, setAttempts] = useState<PaymentResponse[] | null>(null);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [attemptsError, setAttemptsError] = useState<string | null>(null);

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
      setBillTo(null);
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

  // Fetch the Selcom payment-attempt history. Drives both the list shown
  // beneath the invoice totals and the "Cancel invoice" button's
  // disabled state (an in-flight or successful attempt blocks cancel).
  useEffect(() => {
    if (!open || !invoiceId) {
      setAttempts(null);
      setAttemptsError(null);
      return;
    }
    let cancelled = false;
    setAttemptsLoading(true);
    setAttemptsError(null);
    listInvoicePayments(invoiceId)
      .then((data) => {
        if (!cancelled) setAttempts(data ?? []);
      })
      .catch((err) => {
        if (!cancelled)
          setAttemptsError(err instanceof Error ? err.message : "Couldn't load history");
      })
      .finally(() => {
        if (!cancelled) setAttemptsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, invoiceId, attemptsRefreshKey]);

  // Resolve the "Bill to" party from the business + location IDs in scope.
  // Falls back to whatever the invoice DTO carries when neither lookup
  // succeeds (e.g., invoice opened outside of a billing context).
  useEffect(() => {
    if (!open || (!businessId && !locationId)) {
      setBillTo(null);
      return;
    }
    let cancelled = false;
    getInvoiceBillingParties(businessId, locationId)
      .then(({ business, location }) => {
        if (cancelled) return;
        if (!business && !location) {
          setBillTo(null);
          return;
        }
        setBillTo(buildBillToParty(location, business));
      })
      .catch(() => {
        if (!cancelled) setBillTo(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open, businessId, locationId]);

  const statusMeta = invoice ? getInvoiceStatusMeta(invoice.status) : null;
  const isPending = invoice?.status === "PENDING";
  // Consolidated invoices are paid at the business level; locationId is only
  // used for the (optional) bill-to address, never for payment. Gating canPay on
  // locationId would wrongly disable Pay now that the Invoices tab bills to the
  // business rather than the first subscription item.
  const canPay = isPending && !!businessId;
  // Cancel is blocked while an attempt is INITIATING/PROCESSING (USSD push
  // could still confirm) or has already SUCCEEDED (a real customer payment
  // we can't void). Server enforces the same rule on the cancel endpoint.
  const cancelBlocked = hasBlockingPayment(attempts);
  const party = invoice ? (billTo ?? customerToParty(invoice)) : null;

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
          className="grid max-h-[calc(100vh-4rem)] max-w-[620px] grid-rows-[1fr_auto] gap-0 overflow-hidden p-0"
          overlayClassName="bg-foreground/40 backdrop-blur-sm"
        >
          <div className="min-h-0 overflow-y-auto px-7 pb-6 pt-7">
            <div className="flex items-start justify-between gap-5 pr-8">
              <div className="min-w-0">
                <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {(invoice && DOC_LABEL[invoice.status]) ?? "Invoice"}
                </p>
                <DialogTitle className="mt-2 truncate font-mono text-[18px] font-semibold tracking-[-0.01em] text-ink">
                  {invoice?.invoiceNumber ?? "Loading…"}
                </DialogTitle>
              </div>
              {statusMeta && (
                <StatusPill tone={toPillTone(statusMeta.variant)}>
                  {statusMeta.label}
                </StatusPill>
              )}
            </div>

            {loading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {invoice && !loading && (
              <>
                <div className="my-6 grid grid-cols-1 gap-4 border-y border-line py-5 sm:grid-cols-2 sm:gap-x-7">
                  <MetaCell
                    label="Issued"
                    value={formatBillingDate(invoice.invoiceDate)}
                    mono
                  />
                  <MetaCell
                    label="Billing period"
                    value={`${formatBillingDate(invoice.periodStart)} – ${formatBillingDate(invoice.periodEnd)}`}
                    mono
                  />
                  <MetaCell
                    label="Billed to"
                    value={party?.name ?? "—"}
                    secondary={party?.secondaryName}
                  />
                  <MetaCell
                    label={invoice.paidAt ? "Paid" : "Due"}
                    value={formatBillingDate(invoice.paidAt ?? invoice.dueDate)}
                    mono
                  />
                </div>

                <div className="overflow-hidden rounded-xl border border-line">
                  {invoice.items.map((line, idx) => (
                    <div
                      key={line.id || `line-${idx}`}
                      className="flex items-start justify-between gap-4 border-b border-line px-4 py-3.5 last:border-b-0"
                    >
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold tracking-[-0.01em] text-ink">
                          {line.description}
                        </p>
                        <p className="mt-0.5 font-mono text-[11.5px] text-muted-foreground">
                          {line.quantity} × {formatAmount(line.unitPrice)}
                          {line.isProration && " · proration"}
                        </p>
                      </div>
                      <p className="flex-none font-mono text-[13.5px] tabular-nums text-ink-2">
                        {formatAmount(line.totalPrice)} {invoice.currency}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-1.5 px-1">
                  <SumRow
                    label="Subtotal"
                    value={`${formatAmount(invoice.subtotal)} ${invoice.currency}`}
                  />
                  <SumRow
                    label={invoice.discountDescription ?? "Discounts"}
                    value={
                      invoice.discountAmount > 0
                        ? `− ${formatAmount(invoice.discountAmount)} ${invoice.currency}`
                        : "—"
                    }
                    tone={invoice.discountAmount > 0 ? "pos" : undefined}
                  />
                  {invoice.taxAmount > 0 && (
                    <SumRow
                      label="Tax"
                      value={`${formatAmount(invoice.taxAmount)} ${invoice.currency}`}
                    />
                  )}
                  <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-line pt-3">
                    <span className="text-[15px] font-bold text-ink">
                      {isPending ? "Total due" : "Total"}
                    </span>
                    <span className="text-[20px] font-bold tracking-[-0.02em] tabular-nums text-ink">
                      {formatAmount(invoice.totalAmount)} {invoice.currency}
                    </span>
                  </div>
                </div>

                {invoice.notes && (
                  <p className="mt-5 rounded-xl border border-line bg-surface px-4 py-3 text-[12.5px] leading-relaxed text-muted-foreground">
                    {invoice.notes}
                  </p>
                )}

                <div className="mt-6 border-t border-line pt-5">
                  <InvoicePaymentAttempts
                    attempts={attempts}
                    loading={attemptsLoading}
                    error={attemptsError}
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-line bg-surface px-7 py-4">
            {invoice && isPending && (
              <Button
                type="button"
                variant="ghost"
                className="h-10 text-neg hover:bg-neg-tint hover:text-neg"
                onClick={() => setConfirmCancelOpen(true)}
                disabled={cancelBlocked}
                title={
                  cancelBlocked
                    ? "Can't cancel — a payment is in progress or already successful for this invoice."
                    : undefined
                }
              >
                <Ban className="h-3.5 w-3.5" />
                Cancel invoice
              </Button>
            )}
            {invoice?.status === "PAID" && (
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-pos">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Settled {formatBillingDate(invoice.paidAt)}
              </span>
            )}
            <div className="ml-auto flex items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                className="h-10"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              {invoice && isPending && (
                <Button
                  type="button"
                  className="h-10"
                  onClick={() => setPayOpen(true)}
                  disabled={!canPay}
                  title={
                    canPay
                      ? undefined
                      : "Missing business context — open this invoice from the billing page."
                  }
                >
                  <Wallet className="h-3.5 w-3.5" />
                  Pay invoice
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {invoice && canPay && (
        <PaymentOptionsDialog
          open={payOpen}
          onOpenChange={(open) => {
            setPayOpen(open);
            // Whenever the payment dialog closes, refresh the attempts
            // list — a timeout-FAILED row or a successful one may need
            // to appear in the history beneath.
            if (!open) setAttemptsRefreshKey((k) => k + 1);
          }}
          invoice={{
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.totalAmount,
            currency: invoice.currency,
          }}
          businessId={businessId!}
          locationId={locationId}
          defaultEmail={defaultEmail ?? invoice.customerEmail ?? undefined}
          defaultPhone={defaultPhone ?? invoice.customerPhone ?? undefined}
          onPaid={() => {
            setPayOpen(false);
            setAttemptsRefreshKey((k) => k + 1);
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
        <AlertDialogContent tone="danger">
          <AlertDialogIcon>
            <Ban className="h-5 w-5" />
          </AlertDialogIcon>
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

function MetaCell({
  label,
  value,
  secondary,
  mono,
}: {
  label: string;
  value: string;
  secondary?: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 truncate text-ink",
          mono ? "font-mono text-[13px]" : "text-[14px] font-medium",
        )}
      >
        {value}
      </p>
      {secondary && (
        <p className="truncate text-[12.5px] text-ink-3">{secondary}</p>
      )}
    </div>
  );
}

// Fallback when no business/location is available (e.g., dialog opened from a
// context that doesn't pass IDs): mirror whatever the invoice DTO carries.
function customerToParty(invoice: InvoiceViewDto): InvoiceParty {
  return {
    name: invoice.customerName || "—",
    addressLines: invoice.customerAddress ? [invoice.customerAddress] : [],
    phone: invoice.customerPhone || undefined,
    email: invoice.customerEmail || undefined,
  };
}

function SumRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "pos" | "neg";
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-[13px]">
      <span className="text-ink-3">{label}</span>
      <span
        className={cn(
          "font-mono tabular-nums",
          tone === "pos" ? "text-pos" : tone === "neg" ? "text-neg" : "text-ink-2",
        )}
      >
        {value}
      </span>
    </div>
  );
}
