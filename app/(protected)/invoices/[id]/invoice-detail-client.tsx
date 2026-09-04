"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import {
  AlertTriangle,
  Ban,
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  Link2,
  Receipt,
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
import { BusinessDocument } from "@/components/documents";
import formStyles from "@/components/forms/styles/form-shell.module.css";
import InvoicePaymentForm from "@/components/forms/invoice-payment-form";
import {
  shareInvoice,
  voidInvoice,
} from "@/lib/actions/invoicing-invoice-actions";
import {
  humanisePaymentMethod,
  type InvoicingDocument,
} from "@/lib/invoicing-document";
import {
  INVOICE_PAYMENT_STATUS_LABELS,
  INVOICE_PAYMENT_STATUS_TONES,
  invoiceBalanceDue,
  isInvoiceOverdue,
  type Invoice,
  type InvoicePayment,
  type InvoicingEvent,
} from "@/types/invoicing/type";

interface Props {
  invoice: Invoice;
  payments: InvoicePayment[];
  timeline: InvoicingEvent[];
  /** The branded document (shared mapper) — built server-side with the letterhead. */
  document: InvoicingDocument;
  autoOpenPay?: boolean;
}

const dt = (d?: string | null) =>
  d ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(d)) : "—";

export function InvoiceDetailClient({
  invoice,
  payments,
  timeline,
  document,
  autoOpenPay,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const currency = invoice.currencyCode;
  const balanceDue = invoiceBalanceDue(invoice);
  const overdue = isInvoiceOverdue(invoice);

  const issued = invoice.status === "ISSUED";
  const paid = invoice.paymentStatus === "PAID";
  const canPay = issued && !paid;
  const canVoid = issued && invoice.paymentStatus === "UNPAID";
  // Invoices converted since the snapshot work carry a token from birth; an
  // older one needs "Share" to mint it. Either way one token serves both the
  // invoice link and, once paid, the receipt link.
  const canShare = issued && !invoice.shareToken;

  const [paySheetOpen, setPaySheetOpen] = useState(!!autoOpenPay && canPay);
  const [confirmVoid, setConfirmVoid] = useState(false);
  const [copied, setCopied] = useState<"invoice" | "receipt" | null>(null);

  // Absolute links need the browser origin; read it after mount so the server
  // and client render the same markup (no hydration mismatch on the URL text).
  const [origin, setOrigin] = useState<string | null>(null);
  useEffect(() => setOrigin(window.location.origin), []);
  const invoiceUrl =
    origin && issued && invoice.shareToken
      ? `${origin}/inv/${invoice.shareToken}`
      : null;
  const receiptUrl =
    origin && issued && paid && invoice.shareToken
      ? `${origin}/receipt/${invoice.shareToken}`
      : null;

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

  const share = () =>
    startTransition(async () => {
      const result = await shareInvoice(invoice.id);
      toast({
        variant: result.responseType === "success" ? "success" : "destructive",
        title: result.responseType === "success" ? "Success" : "Error",
        description: result.message,
      });
      if (result.responseType === "success") router.refresh();
    });

  const copyLink = async (kind: "invoice" | "receipt", url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard may be unavailable */
    }
  };

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

      {(canPay || canVoid || canShare) && (
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
          {canShare && (
            <Button
              variant="outline"
              className="w-full justify-center"
              disabled={isPending}
              onClick={share}
            >
              <Link2 className="mr-1.5 h-3.5 w-3.5" />
              Share invoice
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

      {invoiceUrl && (
        <LinkCard
          label="Invoice link"
          hint="Shows payments as they are recorded."
          url={invoiceUrl}
          copied={copied === "invoice"}
          onCopy={() => copyLink("invoice", invoiceUrl)}
        />
      )}
      {receiptUrl && (
        <LinkCard
          label="Receipt link"
          hint="Paid in full — the same link, as a receipt."
          url={receiptUrl}
          copied={copied === "receipt"}
          onCopy={() => copyLink("receipt", receiptUrl)}
          icon={<Receipt className="h-3 w-3" />}
        />
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
              {/* The document itself — same template (letterhead, logo, tax
                  IDs) as a purchase order or GRN, and byte-for-byte what
                  "Download PDF" and the customer link render. */}
              <div className="overflow-hidden rounded-xl border border-line bg-white">
                <BusinessDocument data={document.data} theme={document.theme} />
              </div>

              {payments.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-line bg-card">
                  <div className="border-b border-line px-4 py-3 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                    Payments received
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-line bg-surface/60 text-left text-xs font-semibold uppercase text-muted-foreground">
                          <th className="px-4 py-2.5">Date</th>
                          <th className="px-4 py-2.5">Method</th>
                          <th className="px-4 py-2.5">Reference</th>
                          <th className="px-4 py-2.5 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {payments.map((p) => (
                          <tr key={p.id}>
                            <td className="px-4 py-2.5 font-mono text-[12.5px] tabular-nums">
                              {dt(p.paymentDate)}
                            </td>
                            <td className="px-4 py-2.5">
                              {humanisePaymentMethod(
                                p.paymentMethodCode ?? p.paymentMethod,
                              )}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-[12.5px] text-muted-foreground">
                              {p.reference || "—"}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono font-semibold tabular-nums">
                              {formatMoney(p.amount, currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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

function LinkCard({
  label,
  hint,
  url,
  copied,
  onCopy,
  icon,
}: {
  label: string;
  hint?: string;
  url: string;
  copied: boolean;
  onCopy: () => void;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="break-all font-mono text-[11.5px] leading-relaxed text-ink-2">
        {url}
      </p>
      {hint && (
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
          {hint}
        </p>
      )}
      <div className="mt-2.5 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 justify-center"
          onClick={onCopy}
        >
          {copied ? (
            <Check className="mr-1.5 h-3.5 w-3.5 text-green-600" />
          ) : (
            <Copy className="mr-1.5 h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button asChild size="sm" variant="ghost" className="flex-1 justify-center">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Open
          </a>
        </Button>
      </div>
    </div>
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
