"use client";

import { useState, useTransition, type ReactNode } from "react";
import {
  AlertTriangle,
  Ban,
  Building2,
  CreditCard,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/helpers";
import { ProformaTotalsRows } from "@/components/invoicing/totals-rows";
import formStyles from "@/components/forms/styles/form-shell.module.css";
import InvoicePaymentForm from "@/components/forms/invoice-payment-form";
import { voidInvoice } from "@/lib/actions/invoicing-invoice-actions";
import {
  INVOICE_PAYMENT_STATUS_LABELS,
  INVOICE_PAYMENT_STATUS_TONES,
  invoiceBalanceDue,
  isInvoiceOverdue,
  type DocTotals,
  type Invoice,
  type InvoicingEvent,
} from "@/types/invoicing/type";

interface Props {
  invoice: Invoice;
  timeline: InvoicingEvent[];
  autoOpenPay?: boolean;
}

const dt = (d?: string | null) =>
  d ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(d)) : "—";

export function InvoiceDetailClient({ invoice, timeline, autoOpenPay }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const currency = invoice.currencyCode;
  const balanceDue = invoiceBalanceDue(invoice);
  const overdue = isInvoiceOverdue(invoice);
  const taxLabel = invoice.taxLabel || "Tax";

  const canPay = invoice.status === "ISSUED" && invoice.paymentStatus !== "PAID";
  const canVoid = invoice.status === "ISSUED" && invoice.paymentStatus === "UNPAID";

  const [paySheetOpen, setPaySheetOpen] = useState(!!autoOpenPay && canPay);
  const [confirmVoid, setConfirmVoid] = useState(false);

  const docTotals: DocTotals = {
    subtotalAmount: invoice.subtotalAmount,
    discountAmount: invoice.discountAmount,
    taxAmount: invoice.taxAmount,
    totalAmount: invoice.totalAmount,
  };

  const doVoid = () =>
    startTransition(async () => {
      const result = await voidInvoice(invoice.id);
      toast({
        variant: result.responseType === "success" ? "success" : "destructive",
        title: result.responseType === "success" ? "Success" : "Error",
        description: result.message,
      });
      if (result.responseType === "success") router.refresh();
    });

  // Sticky rail — payment standing (accent), actions, details. Shared per tab.
  const rail = (
    <aside
      className={cn(formStyles.formStack, "lg:sticky lg:top-4 lg:self-start")}
    >
      <div className="rounded-xl border border-ink bg-ink p-4 text-white">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.1em] text-white/55">
          Balance due
        </div>
        <div className="space-y-2">
          <AccentRow label="Total" value={formatMoney(invoice.totalAmount, currency)} />
          <AccentRow label="Paid" value={formatMoney(invoice.paidAmount, currency)} />
          <div className="mt-1 flex items-baseline justify-between border-t border-white/15 pt-2.5">
            <span className="text-[15px] font-semibold text-white">Balance due</span>
            <span className="font-mono text-lg font-semibold tabular-nums text-white">
              {formatMoney(balanceDue, currency)}
            </span>
          </div>
        </div>
      </div>

      {(canPay || canVoid) && (
        <div className="space-y-2 rounded-xl border border-line bg-card p-4">
          {canPay && (
            <Button
              className="w-full justify-center"
              disabled={isPending}
              onClick={() => setPaySheetOpen(true)}
            >
              <CreditCard className="mr-1.5 h-3.5 w-3.5" />
              Record payment
            </Button>
          )}
          {canVoid && (
            <Button
              variant="outline"
              className="w-full justify-center text-neg hover:bg-neg/10 hover:text-neg"
              disabled={isPending}
              onClick={() => setConfirmVoid(true)}
            >
              <Ban className="mr-1.5 h-3.5 w-3.5" />
              Void invoice
            </Button>
          )}
        </div>
      )}

      <div className="rounded-xl border border-line bg-card p-4">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
          Details
        </div>
        <div className="space-y-2.5">
          <RailRow
            label="Payment"
            value={
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  INVOICE_PAYMENT_STATUS_TONES[invoice.paymentStatus],
                )}
              >
                {INVOICE_PAYMENT_STATUS_LABELS[invoice.paymentStatus]}
              </span>
            }
          />
          <RailRow label="Issued" value={dt(invoice.issueDate)} />
          <RailRow
            label="Due"
            value={
              <span className={overdue ? "text-neg" : undefined}>
                {dt(invoice.dueDate)}
              </span>
            }
          />
          <RailRow label="Line items" value={String(invoice.lines?.length ?? 0)} />
          <RailRow label="Currency" value={currency} />
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {overdue && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-neg/10 px-3 py-2 text-sm text-neg">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          This invoice is overdue — it was due {dt(invoice.dueDate)}.
        </div>
      )}

      <Tabs defaultValue="invoice">
        <TabsList>
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
          <TabsTrigger value="timeline">Timeline ({timeline.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="invoice" className="mt-5">
          <div className={formStyles.formGrid}>
            <div className={formStyles.formStack}>
              {/* From / Bill to */}
              <div className="grid grid-cols-1 gap-6 rounded-xl border border-line bg-card p-4 sm:grid-cols-2 sm:p-5">
                <div>
                  <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                    <Building2 className="h-3 w-3" /> From
                  </p>
                  <p className="text-sm font-semibold text-ink">
                    {invoice.locationName ?? invoice.businessName ?? "—"}
                  </p>
                  {invoice.businessName &&
                    invoice.locationName &&
                    invoice.businessName !== invoice.locationName && (
                      <p className="text-sm text-muted-foreground">
                        {invoice.businessName}
                      </p>
                    )}
                  {invoice.locationAddress && (
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {invoice.locationAddress}
                    </p>
                  )}
                  {(invoice.businessTin || invoice.businessVrn) && (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {invoice.businessTin ? `TIN ${invoice.businessTin}` : ""}
                      {invoice.businessVrn ? `  VRN ${invoice.businessVrn}` : ""}
                    </p>
                  )}
                </div>
                <div>
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                    Bill to
                  </p>
                  <p className="text-sm font-semibold text-ink">
                    {invoice.customerName}
                  </p>
                  {invoice.customerPhone && (
                    <p className="text-sm text-muted-foreground">
                      {invoice.customerPhone}
                    </p>
                  )}
                  {invoice.customerEmail && (
                    <p className="text-sm text-muted-foreground">
                      {invoice.customerEmail}
                    </p>
                  )}
                  {invoice.customerTin && (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      TIN {invoice.customerTin}
                    </p>
                  )}
                </div>
              </div>

              {/* Lines + totals */}
              <div className="overflow-hidden rounded-xl border border-line bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line bg-surface/60 text-left text-xs font-semibold uppercase text-muted-foreground">
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3 text-right">Qty</th>
                        <th className="px-4 py-3 text-right">Unit price</th>
                        <th className="px-4 py-3 text-right">Discount</th>
                        <th className="px-4 py-3 text-right">{taxLabel}</th>
                        <th className="px-4 py-3 text-right">Line total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {invoice.lines?.map((l) => (
                        <tr key={l.id}>
                          <td className="px-4 py-3 font-medium">{l.description}</td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums">
                            {l.quantity}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums">
                            {formatMoney(l.unitPrice, currency)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-2">
                            {l.lineDiscountAmount
                              ? formatMoney(l.lineDiscountAmount, currency)
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-2">
                            {l.taxAmount ? formatMoney(l.taxAmount, currency) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                            {formatMoney(l.lineTotal ?? 0, currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end border-t border-line p-4">
                  <div className="w-full max-w-xs">
                    <ProformaTotalsRows totals={docTotals} currency={currency} />
                  </div>
                </div>
              </div>

              {/* Payment terms / details */}
              {(invoice.paymentInstructionsText || invoice.paymentDetailsText) && (
                <div className="space-y-3 rounded-xl border border-line bg-card p-4 text-sm sm:p-5">
                  {invoice.paymentInstructionsText && (
                    <div>
                      <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                        Payment terms
                      </p>
                      <p className="whitespace-pre-wrap text-ink-2">
                        {invoice.paymentInstructionsText}
                      </p>
                    </div>
                  )}
                  {invoice.paymentDetailsText && (
                    <div>
                      <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                        Payment details
                      </p>
                      <p className="whitespace-pre-wrap text-ink-2">
                        {invoice.paymentDetailsText}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            {rail}
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-5">
          <div className={formStyles.formGrid}>
            <div className="min-w-0 rounded-xl border border-line bg-card p-4 sm:p-5">
              {timeline.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No events yet.
                </div>
              ) : (
                <ol className="space-y-1">
                  {timeline.map((e, i) => (
                    <li key={e.id} className="flex gap-3.5">
                      <div className="flex flex-col items-center">
                        <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg border border-line bg-canvas text-ink-2">
                          <FileText className="h-3.5 w-3.5" />
                        </span>
                        {i < timeline.length - 1 && (
                          <span className="my-1 w-px flex-1 bg-line" />
                        )}
                      </div>
                      <div className="flex-1 pb-4 pt-0.5">
                        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                          {e.eventType}
                        </div>
                        {e.description && (
                          <div className="mt-1 text-sm font-medium text-ink">
                            {e.description}
                          </div>
                        )}
                        <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                          {new Date(e.occurredAt).toLocaleString()}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
            {rail}
          </div>
        </TabsContent>
      </Tabs>

      <InvoicePaymentForm
        invoice={invoice}
        open={paySheetOpen}
        onOpenChange={setPaySheetOpen}
        onRecorded={() => router.refresh()}
      />

      <AlertDialog open={confirmVoid} onOpenChange={setConfirmVoid}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void this invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              {invoice.invoiceNumber} will be marked VOIDED and the receivable
              reversed in the journal. Only unpaid invoices can be voided.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isPending} onClick={doVoid}>
              Void
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function AccentRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between text-[13px]">
      <span className="text-white/60">{label}</span>
      <span className="font-mono tabular-nums text-white/90">{value}</span>
    </div>
  );
}

function RailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-[12.5px] font-semibold text-ink-2">
        {value}
      </span>
    </div>
  );
}
