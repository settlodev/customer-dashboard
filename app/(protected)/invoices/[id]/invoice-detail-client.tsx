"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Ban,
  Building2,
  CalendarDays,
  CircleDollarSign,
  CreditCard,
  FileText,
  Receipt,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import { useToast } from "@/hooks/use-toast";
import { formatMoney } from "@/lib/helpers";
import InvoicePaymentForm from "@/components/forms/invoice-payment-form";
import { voidInvoice } from "@/lib/actions/invoicing-invoice-actions";
import {
  invoiceBalanceDue,
  isInvoiceOverdue,
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

  const canPay = invoice.status === "ISSUED" && invoice.paymentStatus !== "PAID";
  const canVoid = invoice.status === "ISSUED" && invoice.paymentStatus === "UNPAID";

  const [paySheetOpen, setPaySheetOpen] = useState(!!autoOpenPay && canPay);
  const [confirmVoid, setConfirmVoid] = useState(false);

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

  const taxLabel = invoice.taxLabel || "Tax";

  return (
    <>
      <KpiStrip cols={4}>
        <KpiCard
          icon={<CircleDollarSign className="h-3 w-3" />}
          label="Total"
          value={invoice.totalAmount.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}
          unit={currency}
        />
        <KpiCard
          icon={<Receipt className="h-3 w-3" />}
          label="Paid"
          value={invoice.paidAmount.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}
          unit={currency}
          deltaTone="pos"
        />
        <KpiCard
          icon={<Wallet className="h-3 w-3" />}
          label="Balance due"
          value={balanceDue.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}
          unit={currency}
          deltaTone={balanceDue > 0 ? "neg" : "pos"}
        />
        <KpiCard
          icon={
            overdue ? (
              <AlertTriangle className="h-3 w-3" />
            ) : (
              <CalendarDays className="h-3 w-3" />
            )
          }
          label="Due date"
          value={dt(invoice.dueDate)}
          delta={overdue ? "Overdue" : undefined}
          deltaTone={overdue ? "neg" : "neutral"}
        />
      </KpiStrip>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2">
        {canPay && (
          <Button size="sm" disabled={isPending} onClick={() => setPaySheetOpen(true)}>
            <CreditCard className="mr-1.5 h-3.5 w-3.5" />
            Record payment
          </Button>
        )}
        {canVoid && (
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-red-600 hover:text-red-700"
            disabled={isPending}
            onClick={() => setConfirmVoid(true)}
          >
            <Ban className="mr-1.5 h-3.5 w-3.5" />
            Void
          </Button>
        )}
      </div>

      <Tabs defaultValue="invoice">
        <TabsList>
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
          <TabsTrigger value="timeline">Timeline ({timeline.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="invoice" className="mt-4 space-y-4">
          {/* Issuer + customer */}
          <Card>
            <CardContent className="grid grid-cols-1 gap-6 pt-6 sm:grid-cols-2">
              <div>
                <p className="mb-2 flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                  <Building2 className="h-3 w-3" /> From
                </p>
                <p className="text-sm font-semibold">
                  {invoice.businessName ?? "—"}
                </p>
                {invoice.locationName && (
                  <p className="text-sm text-muted-foreground">
                    {invoice.locationName}
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
                <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                  Bill to
                </p>
                <p className="text-sm font-semibold">{invoice.customerName}</p>
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
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  Issued {dt(invoice.issueDate)} · Due {dt(invoice.dueDate)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Lines */}
          <Card>
            <CardContent className="px-2 pt-6 sm:px-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50/60 text-left text-xs font-semibold uppercase text-gray-400">
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right">Unit price</th>
                      <th className="px-4 py-3 text-right">Discount</th>
                      <th className="px-4 py-3 text-right">{taxLabel}</th>
                      <th className="px-4 py-3 text-right">Line total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoice.lines?.map((l) => (
                      <tr key={l.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3">{l.description}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {l.quantity}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {formatMoney(l.unitPrice, currency)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {l.lineDiscountAmount
                            ? formatMoney(l.lineDiscountAmount, currency)
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {l.taxAmount ? formatMoney(l.taxAmount, currency) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-medium tabular-nums">
                          {formatMoney(l.lineTotal ?? 0, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex justify-end">
                <dl className="w-full max-w-xs space-y-1 font-mono text-sm tabular-nums">
                  <Row label="Subtotal" value={formatMoney(invoice.subtotalAmount, currency)} />
                  {invoice.discountAmount > 0 && (
                    <Row
                      label="Discount"
                      value={`−${formatMoney(invoice.discountAmount, currency)}`}
                    />
                  )}
                  <Row label={taxLabel} value={formatMoney(invoice.taxAmount, currency)} />
                  <div className="flex justify-between border-t border-line pt-1 text-base font-semibold text-ink">
                    <dt>Total</dt>
                    <dd>{formatMoney(invoice.totalAmount, currency)}</dd>
                  </div>
                  <Row label="Paid" value={formatMoney(invoice.paidAmount, currency)} />
                  <div className="flex justify-between font-semibold text-ink">
                    <dt>Balance due</dt>
                    <dd>{formatMoney(balanceDue, currency)}</dd>
                  </div>
                </dl>
              </div>
            </CardContent>
          </Card>

          {/* Payment instructions */}
          {(invoice.paymentDetailsText || invoice.paymentInstructionsText) && (
            <Card>
              <CardContent className="space-y-2 pt-6 text-sm">
                {invoice.paymentInstructionsText && (
                  <div>
                    <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                      Payment terms
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">
                      {invoice.paymentInstructionsText}
                    </p>
                  </div>
                )}
                {invoice.paymentDetailsText && (
                  <div>
                    <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                      Payment details
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">
                      {invoice.paymentDetailsText}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {timeline.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No events yet.
                </div>
              ) : (
                <ol className="space-y-3">
                  {timeline.map((e) => (
                    <li key={e.id} className="flex gap-3">
                      <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm">
                          <span className="font-medium">{e.eventType}</span>
                          {e.description ? ` — ${e.description}` : ""}
                        </div>
                        <div className="font-mono text-[11px] text-muted-foreground">
                          {new Date(e.occurredAt).toLocaleString()}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
