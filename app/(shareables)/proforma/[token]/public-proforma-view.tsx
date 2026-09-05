"use client";

import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, FileText, Loader2 } from "lucide-react";

import Link from "next/link";
import { PrintableDocument } from "@/components/documents";
import {
  ActionBarSpacer,
  PublicActionBar,
} from "@/components/documents/PublicActionBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/helpers";
import {
  buildInvoiceDocument,
  buildProformaDocument,
} from "@/lib/invoicing-document";
import { acceptPublicProforma } from "@/lib/actions/invoicing-public-actions";
import {
  PROFORMA_STATUS_LABELS,
  type PublicArInvoice,
  type PublicProforma,
} from "@/types/invoicing/type";

interface Props {
  token: string;
  initial: PublicProforma;
}

const num = (v: number | null | undefined) => Number(v ?? 0);

export function PublicProformaView({ token, initial }: Props) {
  const [invoice, setInvoice] = useState<PublicArInvoice | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
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

  // Just accepted: show the invoice that was created, and hand over its own
  // link — this proforma link stays a snapshot of the quote from here on.
  if (invoice) {
    const doc = buildInvoiceDocument(invoice, { payments: invoice.payments });
    const invoiceHref = invoice.shareToken
      ? `/inv/${encodeURIComponent(invoice.shareToken)}`
      : null;
    return (
      <>
        <PrintableDocument
          data={doc.data}
          theme={doc.theme}
          documentTitle={doc.documentTitle}
        />
        <ActionBarSpacer />
        <PublicActionBar className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm text-slate-700">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
            <span>
              Accepted — this proforma is now invoice{" "}
              <span className="font-semibold">{invoice.invoiceNumber}</span>.
            </span>
          </p>
          {invoiceHref && (
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href={invoiceHref}>
                <FileText className="mr-1.5 h-4 w-4" />
                Open invoice link
              </Link>
            </Button>
          )}
        </PublicActionBar>
      </>
    );
  }

  const doc = buildProformaDocument(initial);
  const canAccept = initial.status === "SENT";
  const alreadyConverted = initial.status === "CONVERTED";
  const convertedHref = initial.convertedInvoiceShareToken
    ? `/inv/${encodeURIComponent(initial.convertedInvoiceShareToken)}`
    : null;

  return (
    <>
      <PrintableDocument
        data={doc.data}
        theme={doc.theme}
        documentTitle={doc.documentTitle}
      />
      <ActionBarSpacer />

      {/* Always-visible action bar — floats above the document, never prints. */}
      <PublicActionBar className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {canAccept ? (
            <>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  Accept this proforma
                </p>
                <p className="text-xs text-muted-foreground">
                  Total{" "}
                  <span className="font-medium text-slate-700">
                    {formatMoney(num(initial.totalAmount), initial.currencyCode)}
                  </span>{" "}
                  · accepting generates an invoice with payment details
                </p>
              </div>
              <Button
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => {
                  setError(null);
                  setShowConfirm(true);
                }}
                disabled={isPending}
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Accept &amp; get invoice
              </Button>
            </>
          ) : alreadyConverted ? (
            <>
              <p className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                <span>
                  This proforma was accepted and is now invoice{" "}
                  <span className="font-semibold text-slate-900">
                    {initial.convertedInvoiceNumber ?? "—"}
                  </span>
                  . This copy is the quote as accepted; payments are shown on
                  the invoice.
                </span>
              </p>
              {convertedHref && (
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href={convertedHref}>
                    <FileText className="mr-1.5 h-4 w-4" />
                    View invoice
                  </Link>
                </Button>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500">
              This proforma is{" "}
              {PROFORMA_STATUS_LABELS[initial.status].toLowerCase()} and can no
              longer be accepted — contact the business for an updated quote.
            </p>
          )}
      </PublicActionBar>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={!isPending ? () => setShowConfirm(false) : undefined}
          />
          <div className="relative w-full max-w-md space-y-5 rounded-2xl bg-white p-6 shadow-xl sm:p-8">
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900">
                Accept {initial.proformaNumber}?
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                This generates an invoice for{" "}
                {formatMoney(num(initial.totalAmount), initial.currencyCode)} with
                payment details.
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                Your name (optional)
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Doe"
                disabled={isPending}
                className="mt-1"
              />
            </div>
            {error && (
              <p className="flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button onClick={accept} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                )}
                Confirm &amp; accept
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
