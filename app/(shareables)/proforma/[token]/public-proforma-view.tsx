"use client";

import { useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Printer,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/helpers";
import {
  acceptPublicProforma,
} from "@/lib/actions/invoicing-public-actions";
import {
  INVOICE_PAYMENT_STATUS_LABELS,
  PROFORMA_STATUS_LABELS,
  type PublicArInvoice,
  type PublicProforma,
} from "@/types/invoicing/type";

interface Props {
  token: string;
  initial: PublicProforma;
}

const dt = (d?: string | null) =>
  d ? new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(d)) : null;

export function PublicProformaView({ token, initial }: Props) {
  const [invoice, setInvoice] = useState<PublicArInvoice | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const accept = () =>
    startTransition(async () => {
      setError(null);
      const result = await acceptPublicProforma(token, name);
      if (result.responseType === "success" && result.data) {
        setInvoice(result.data);
      } else {
        setError(result.message || "Something went wrong. Please try again.");
      }
    });

  // Once accepted, show the resulting invoice.
  if (invoice) {
    return (
      <PaperShell>
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          Accepted — here is your invoice {invoice.invoiceNumber}.
        </div>
        <InvoiceDocument invoice={invoice} />
      </PaperShell>
    );
  }

  const currency = initial.currencyCode;
  const canAccept = initial.status === "SENT";
  const alreadyConverted = initial.status === "CONVERTED";

  return (
    <PaperShell>
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Proforma invoice
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            {initial.proformaNumber}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Prepared for {initial.customerName}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {PROFORMA_STATUS_LABELS[initial.status]}
          </span>
          {dt(initial.validUntil) && (
            <p className="mt-2 text-xs text-slate-500">
              Valid until {dt(initial.validUntil)}
            </p>
          )}
        </div>
      </div>

      <LineTable
        currency={currency}
        lines={initial.lines}
        subtotal={initial.subtotalAmount}
        discount={initial.discountAmount}
        tax={initial.taxAmount}
        total={initial.totalAmount}
      />

      {initial.notes && (
        <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Notes
          </p>
          <p className="whitespace-pre-wrap">{initial.notes}</p>
        </div>
      )}

      {/* Accept / status panel */}
      <div className="mt-8 border-t border-slate-200 pt-6 print:hidden">
        {canAccept ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-sm font-semibold text-slate-800">
              Accept this proforma
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Accepting generates an invoice for{" "}
              <span className="font-medium text-slate-700">
                {formatMoney(initial.totalAmount, currency)}
              </span>{" "}
              with payment details.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                disabled={isPending}
                className="bg-white"
              />
              <Button onClick={accept} disabled={isPending} className="sm:w-44">
                {isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                )}
                Accept &amp; get invoice
              </Button>
            </div>
            {error && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            )}
          </div>
        ) : alreadyConverted ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-600">
              This proforma has already been accepted.
            </p>
            <Button
              onClick={accept}
              disabled={isPending}
              variant="outline"
              className="mt-3"
            >
              {isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-1.5 h-4 w-4" />
              )}
              View invoice
            </Button>
            {error && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
            This proforma is {PROFORMA_STATUS_LABELS[initial.status].toLowerCase()}{" "}
            and can no longer be accepted. Please contact the business for an
            updated quote.
          </div>
        )}
      </div>
    </PaperShell>
  );
}

// ── Shared paper shell + document pieces ──────────────────────────────

function PaperShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-10 print:shadow-none print:ring-0">
        {children}
      </div>
      <div className="mt-4 flex justify-center print:hidden">
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-500"
          onClick={() => window.print()}
        >
          <Printer className="mr-1.5 h-3.5 w-3.5" />
          Print / save as PDF
        </Button>
      </div>
    </div>
  );
}

function LineTable({
  currency,
  lines,
  subtotal,
  discount,
  tax,
  total,
  paid,
  balanceDue,
}: {
  currency: string;
  lines: { description: string; quantity: number; unitPrice: number; lineTotal: number }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid?: number;
  balanceDue?: number;
}) {
  return (
    <>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase text-slate-400">
              <th className="py-2 pr-3">Description</th>
              <th className="py-2 px-3 text-right">Qty</th>
              <th className="py-2 px-3 text-right">Unit price</th>
              <th className="py-2 pl-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((l, i) => (
              <tr key={i}>
                <td className="py-3 pr-3 text-slate-700">{l.description}</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">
                  {l.quantity}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">
                  {formatMoney(l.unitPrice, currency)}
                </td>
                <td className="py-3 pl-3 text-right font-mono font-medium tabular-nums text-slate-800">
                  {formatMoney(l.lineTotal, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex justify-end">
        <dl className="w-full max-w-xs space-y-1.5 font-mono text-sm tabular-nums">
          <div className="flex justify-between text-slate-500">
            <dt>Subtotal</dt>
            <dd>{formatMoney(subtotal, currency)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-slate-500">
              <dt>Discount</dt>
              <dd>−{formatMoney(discount, currency)}</dd>
            </div>
          )}
          <div className="flex justify-between text-slate-500">
            <dt>Tax</dt>
            <dd>{formatMoney(tax, currency)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1.5 text-base font-semibold text-slate-900">
            <dt>Total</dt>
            <dd>{formatMoney(total, currency)}</dd>
          </div>
          {paid != null && paid > 0 && (
            <div className="flex justify-between text-slate-500">
              <dt>Paid</dt>
              <dd>{formatMoney(paid, currency)}</dd>
            </div>
          )}
          {balanceDue != null && (
            <div className="flex justify-between font-semibold text-slate-900">
              <dt>Balance due</dt>
              <dd>{formatMoney(balanceDue, currency)}</dd>
            </div>
          )}
        </dl>
      </div>
    </>
  );
}

function InvoiceDocument({ invoice }: { invoice: PublicArInvoice }) {
  const currency = invoice.currencyCode;
  return (
    <>
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Invoice
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            {invoice.invoiceNumber}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Billed to {invoice.customerName}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {INVOICE_PAYMENT_STATUS_LABELS[invoice.paymentStatus]}
          </span>
          <p className="mt-2 text-xs text-slate-500">
            Issued {dt(invoice.issueDate)}
            {dt(invoice.dueDate) ? ` · Due ${dt(invoice.dueDate)}` : ""}
          </p>
        </div>
      </div>

      <LineTable
        currency={currency}
        lines={invoice.lines}
        subtotal={invoice.subtotalAmount}
        discount={invoice.discountAmount}
        tax={invoice.taxAmount}
        total={invoice.totalAmount}
        paid={invoice.paidAmount}
        balanceDue={invoice.balanceDue}
      />

      {(invoice.paymentInstructionsText || invoice.paymentDetailsText) && (
        <div className="mt-6 space-y-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
          {invoice.paymentInstructionsText && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Payment terms
              </p>
              <p className="whitespace-pre-wrap">
                {invoice.paymentInstructionsText}
              </p>
            </div>
          )}
          {invoice.paymentDetailsText && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Payment details
              </p>
              <p className="whitespace-pre-wrap">{invoice.paymentDetailsText}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
