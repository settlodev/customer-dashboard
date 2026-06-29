"use client";

import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, FileText, Loader2 } from "lucide-react";

import { PrintableDocument } from "@/components/documents";
import type {
  BusinessDocumentData,
  BusinessIdentity,
  LineItem,
} from "@/components/documents";
import {
  ActionBarSpacer,
  PublicActionBar,
} from "@/components/documents/PublicActionBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_CURRENCY, formatMoney } from "@/lib/helpers";
import { acceptPublicProforma } from "@/lib/actions/invoicing-public-actions";
import {
  INVOICE_PAYMENT_STATUS_LABELS,
  PROFORMA_STATUS_LABELS,
  type InvoicePaymentStatus,
  type ProformaStatus,
  type PublicArInvoice,
  type PublicProforma,
} from "@/types/invoicing/type";

interface Props {
  token: string;
  initial: PublicProforma;
}

const SETTLO_PRIMARY = "#ED7B40";
const SETTLO_SECONDARY = "#1E293B";
const THEME = { primaryColor: SETTLO_PRIMARY, secondaryColor: SETTLO_SECONDARY };

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const PROFORMA_TONE: Record<ProformaStatus, Tone> = {
  DRAFT: "neutral",
  SENT: "info",
  ACCEPTED: "success",
  CONVERTED: "success",
  DECLINED: "danger",
  EXPIRED: "warning",
  CANCELLED: "neutral",
};

const PAYMENT_TONE: Record<InvoicePaymentStatus, Tone> = {
  UNPAID: "danger",
  PARTIALLY_PAID: "warning",
  PAID: "success",
};

const num = (v: number | null | undefined) => Number(v ?? 0);

const composeAddress = (raw?: string | null): string[] =>
  raw
    ? raw
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
    : [];

function issuerFrom(d: {
  businessName?: string | null;
  businessTin?: string | null;
  businessVrn?: string | null;
  locationName?: string | null;
  locationAddress?: string | null;
}): BusinessIdentity {
  return {
    // Prefer the location's identity (name + address + tax IDs); fall back to
    // the business name only when the location name is missing.
    name: d.locationName?.trim() || d.businessName?.trim() || "Business",
    addressLines: composeAddress(d.locationAddress),
    tin: d.businessTin ?? undefined,
    vrn: d.businessVrn ?? undefined,
  };
}

function proformaToData(p: PublicProforma): BusinessDocumentData {
  const items: LineItem[] = p.lines.map((l) => ({
    name: l.description || "—",
    quantity: num(l.quantity),
    unitPrice: num(l.unitPrice),
    amount: num(l.lineTotal),
  }));
  return {
    meta: {
      type: "quote",
      titleOverride: "PROFORMA INVOICE",
      documentNumber: p.proformaNumber,
      issueDate: p.issueDate || p.validUntil || "",
      dueDate: p.validUntil ?? undefined,
      status: {
        label: PROFORMA_STATUS_LABELS[p.status],
        tone: PROFORMA_TONE[p.status],
      },
    },
    issuer: issuerFrom(p),
    recipient: p.customerName
      ? {
          name: p.customerName,
          phone: p.customerPhone ?? undefined,
          email: p.customerEmail ?? undefined,
          tin: p.customerTin ?? undefined,
        }
      : undefined,
    items,
    totals: {
      subtotal: num(p.subtotalAmount),
      taxes:
        num(p.taxAmount) > 0
          ? [{ label: "Tax", rate: 0, amount: num(p.taxAmount) }]
          : undefined,
      discount:
        num(p.discountAmount) > 0
          ? { label: "Discount", amount: num(p.discountAmount) }
          : undefined,
      total: num(p.totalAmount),
      amountDue: num(p.totalAmount),
    },
    currency: p.currencyCode || DEFAULT_CURRENCY,
    notes: p.notes ?? undefined,
    footerMessage: "This is a proforma invoice and is not a tax invoice.",
  };
}

function invoiceToData(inv: PublicArInvoice): BusinessDocumentData {
  const items: LineItem[] = inv.lines.map((l) => ({
    name: l.description || "—",
    quantity: num(l.quantity),
    unitPrice: num(l.unitPrice),
    amount: num(l.lineTotal),
  }));
  const notes = [inv.paymentInstructionsText, inv.paymentDetailsText]
    .filter((s): s is string => Boolean(s && s.trim()))
    .join("\n\n");
  return {
    meta: {
      type: "invoice",
      documentNumber: inv.invoiceNumber,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate ?? undefined,
      status: {
        label: INVOICE_PAYMENT_STATUS_LABELS[inv.paymentStatus],
        tone: PAYMENT_TONE[inv.paymentStatus],
      },
    },
    issuer: issuerFrom(inv),
    recipient: inv.customerName
      ? {
          name: inv.customerName,
          phone: inv.customerPhone ?? undefined,
          email: inv.customerEmail ?? undefined,
          tin: inv.customerTin ?? undefined,
        }
      : undefined,
    items,
    totals: {
      subtotal: num(inv.subtotalAmount),
      taxes:
        num(inv.taxAmount) > 0
          ? [{ label: "Tax", rate: 0, amount: num(inv.taxAmount) }]
          : undefined,
      discount:
        num(inv.discountAmount) > 0
          ? { label: "Discount", amount: num(inv.discountAmount) }
          : undefined,
      total: num(inv.totalAmount),
      payments:
        num(inv.paidAmount) > 0
          ? [
              {
                date: inv.issueDate,
                method: "Payments received",
                amount: num(inv.paidAmount),
              },
            ]
          : undefined,
      amountDue: num(inv.balanceDue),
    },
    currency: inv.currencyCode || DEFAULT_CURRENCY,
    notes: notes || undefined,
    footerMessage: "Thank you for your business and continued support",
  };
}

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

  // Once accepted, the proforma becomes an invoice — show that document.
  if (invoice) {
    const title = `${invoice.businessName?.trim() || invoice.locationName?.trim() || "Settlo"} - Invoice`;
    return (
      <>
        <PrintableDocument
          data={invoiceToData(invoice)}
          theme={THEME}
          documentTitle={title}
        />
        <ActionBarSpacer />
        <PublicActionBar className="flex items-center gap-3 py-3.5">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
          <p className="text-sm text-slate-700">
            Accepted — this proforma is now invoice{" "}
            <span className="font-semibold">{invoice.invoiceNumber}</span>.
          </p>
        </PublicActionBar>
      </>
    );
  }

  const title = `${initial.businessName?.trim() || initial.locationName?.trim() || "Settlo"} - Proforma Invoice`;
  const canAccept = initial.status === "SENT";
  const alreadyConverted = initial.status === "CONVERTED";

  return (
    <>
      <PrintableDocument
        data={proformaToData(initial)}
        theme={THEME}
        documentTitle={title}
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
              <p className="text-sm text-slate-600">
                This proforma has already been accepted.
              </p>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={accept}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-1.5 h-4 w-4" />
                )}
                View invoice
              </Button>
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
