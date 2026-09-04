// Shared Accounting invoicing → BusinessDocument mapping. Used by EVERY
// rendering of a proforma / invoice / receipt — the protected detail pages,
// the authenticated print views, and the public share pages — so the customer
// link, the "Download PDF" and the on-screen document are the same document
// with the same letterhead (logo, business details, tax IDs) as a purchase
// order or GRN.
//
// Two issuer sources feed it. Invoices (and converted proformas) carry a
// FROZEN issuer snapshot from the Accounting Service — that is the truth for
// the document and wins. A letterhead lookup (`getLetterhead()`, authenticated
// only) fills whatever the snapshot lacks: the whole block for a live quote
// that has not been converted yet, or just the logo for an invoice issued
// before logos were frozen.

import type {
  BusinessDocumentData,
  BusinessIdentity,
  LineItem,
  Party,
  PaymentRecord,
} from "@/components/documents";
import { composeLetterheadAddress } from "@/lib/grn-document";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import { isDisplayableImageUrl } from "@/lib/image-url";
import type { LocationLetterhead } from "@/types/letterhead/type";
import {
  INVOICE_PAYMENT_STATUS_LABELS,
  PROFORMA_STATUS_LABELS,
  isInvoiceOverdue,
  type InvoicePaymentStatus,
  type InvoiceStatus,
  type ProformaStatus,
} from "@/types/invoicing/type";

const SETTLO_PRIMARY = "#ED7B40";
const SETTLO_SECONDARY = "#1E293B";

export type DocumentTone = "neutral" | "success" | "warning" | "danger" | "info";

export interface InvoicingDocument {
  data: BusinessDocumentData;
  theme: { primaryColor: string; secondaryColor: string };
  documentTitle: string;
}

/** Brand colours: the location's own when the letterhead carries them, else Settlo's. */
export function invoicingTheme(letterhead?: LocationLetterhead | null) {
  const brand = letterhead?.brand ?? null;
  return {
    primaryColor: brand?.primaryColor?.trim() || SETTLO_PRIMARY,
    secondaryColor: brand?.secondaryColor?.trim() || SETTLO_SECONDARY,
  };
}

// ── Issuer ────────────────────────────────────────────────────────────

/** The frozen issuer block as it appears on invoices, proformas and public DTOs. */
export interface IssuerSnapshotSource {
  businessName?: string | null;
  businessTin?: string | null;
  businessVrn?: string | null;
  locationName?: string | null;
  locationAddress?: string | null;
  issuerPhone?: string | null;
  issuerEmail?: string | null;
  locationCity?: string | null;
  locationRegion?: string | null;
  issuerCountry?: string | null;
  issuerLogoUrl?: string | null;
  issuerWebsite?: string | null;
}

const clean = (s?: string | null): string | undefined => {
  const t = s?.trim();
  return t ? t : undefined;
};

const splitLines = (raw?: string | null): string[] =>
  raw
    ? raw
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
    : [];

const hasSnapshot = (src?: IssuerSnapshotSource | null): src is IssuerSnapshotSource =>
  Boolean(src && (clean(src.businessName) || clean(src.locationName)));

/**
 * Issuer identity for the document header. Snapshot first, letterhead for
 * the gaps. The BUSINESS is the name on the letterhead (as on PO/GRN); the
 * branch, when it differs, leads the address block — `legalName` is not used
 * because `DocumentHeader` renders it INSTEAD of `name`.
 */
export function issuerFromSnapshot(
  src: IssuerSnapshotSource | null | undefined,
  letterhead?: LocationLetterhead | null,
): BusinessIdentity {
  const lh = letterhead?.letterhead ?? null;
  const taxIds = letterhead?.taxIds ?? null;

  if (!hasSnapshot(src)) {
    // No frozen block (a live quote, or a legacy invoice with nothing
    // stamped) — the letterhead IS the issuer, exactly as for a GRN.
    const name = clean(lh?.businessName) ?? clean(lh?.locationName) ?? "Business";
    const addressLines: string[] = [];
    const branch = clean(lh?.locationName);
    if (branch && branch !== name) addressLines.push(branch);
    addressLines.push(...composeLetterheadAddress(lh));
    const logo = clean(lh?.logoUrl);
    return {
      name,
      logoUrl: isDisplayableImageUrl(logo) ? logo : undefined,
      addressLines,
      phone: clean(lh?.phone),
      email: clean(lh?.email),
      website: clean(lh?.website),
      tin: clean(taxIds?.tin),
      vrn: clean(taxIds?.vrn),
    };
  }

  const name = clean(src.businessName) ?? clean(src.locationName) ?? "Business";
  const addressLines: string[] = [];
  const branch = clean(src.locationName);
  if (branch && branch !== name) addressLines.push(branch);
  addressLines.push(...splitLines(src.locationAddress));
  const locale = [src.locationCity, src.locationRegion, src.issuerCountry]
    .map(clean)
    .filter(Boolean)
    .join(", ");
  if (locale) addressLines.push(locale);

  const logo = clean(src.issuerLogoUrl) ?? clean(lh?.logoUrl);
  return {
    name,
    logoUrl: isDisplayableImageUrl(logo) ? logo : undefined,
    addressLines,
    phone: clean(src.issuerPhone) ?? clean(lh?.phone),
    email: clean(src.issuerEmail) ?? clean(lh?.email),
    website: clean(src.issuerWebsite) ?? clean(lh?.website),
    tin: clean(src.businessTin) ?? clean(taxIds?.tin),
    vrn: clean(src.businessVrn) ?? clean(taxIds?.vrn),
  };
}

// ── Shared pieces ─────────────────────────────────────────────────────

interface CustomerSource {
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerTin?: string | null;
}

function recipientFrom(c: CustomerSource): Party | undefined {
  const name = clean(c.customerName);
  if (!name) return undefined;
  return {
    name,
    phone: clean(c.customerPhone),
    email: clean(c.customerEmail),
    tin: clean(c.customerTin),
  };
}

interface LineSource {
  description?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  lineTotal?: number | null;
  lineDiscountAmount?: number | null;
  taxAmount?: number | null;
  taxRate?: number | null;
}

const num = (v: number | null | undefined) => Number(v ?? 0);

function lineItemsFrom(lines: LineSource[], showLineTax: boolean): LineItem[] {
  return lines.map((l) => {
    const qty = num(l.quantity);
    const price = num(l.unitPrice);
    const discount = num(l.lineDiscountAmount);
    return {
      name: clean(l.description) ?? "—",
      description: discount > 0 ? `Discount −${discount.toLocaleString()}` : undefined,
      quantity: qty,
      unitPrice: price,
      amount: l.lineTotal != null ? num(l.lineTotal) : qty * price - discount,
      ...(showLineTax
        ? {
            taxAmount: num(l.taxAmount),
            taxRatePercent:
              l.taxRate != null ? Math.round(num(l.taxRate) * 10000) / 100 : undefined,
          }
        : {}),
    };
  });
}

/** Recorded payment as it comes off either the protected or the public API. */
export interface PaymentSource {
  paymentDate?: string | null;
  paymentMethod?: string | null;
  paymentMethodCode?: string | null;
  amount?: number | null;
  reference?: string | null;
}

/** "MOBILE_MONEY" → "Mobile money", "CASH" → "Cash". */
export function humanisePaymentMethod(code?: string | null): string {
  const raw = clean(code);
  if (!raw) return "Payment";
  const words = raw.replace(/[-_]+/g, " ").trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function paymentRecordsFrom(
  payments: PaymentSource[] | null | undefined,
  fallbackDate: string,
): PaymentRecord[] {
  return (payments ?? [])
    .filter((p) => num(p.amount) > 0)
    .map((p) => ({
      date: p.paymentDate || fallbackDate,
      method: humanisePaymentMethod(p.paymentMethodCode ?? p.paymentMethod),
      amount: num(p.amount),
      reference: clean(p.reference),
    }));
}

const issuerDisplayName = (issuer: BusinessIdentity) =>
  issuer.name?.trim() || "Settlo";

// ── Proforma ──────────────────────────────────────────────────────────

const PROFORMA_TONE: Record<ProformaStatus, DocumentTone> = {
  DRAFT: "neutral",
  SENT: "info",
  ACCEPTED: "success",
  CONVERTED: "success",
  DECLINED: "danger",
  EXPIRED: "warning",
  CANCELLED: "neutral",
};

export interface ProformaDocumentSource extends IssuerSnapshotSource, CustomerSource {
  proformaNumber: string;
  status: ProformaStatus;
  currencyCode?: string | null;
  validUntil?: string | null;
  /** Public DTO carries `issueDate`; the protected entity has `createdAt`. */
  issueDate?: string | null;
  createdAt?: string | null;
  notes?: string | null;
  lines: LineSource[];
  subtotalAmount?: number | null;
  discountAmount?: number | null;
  taxAmount?: number | null;
  totalAmount?: number | null;
}

export function buildProformaDocument(
  p: ProformaDocumentSource,
  letterhead?: LocationLetterhead | null,
): InvoicingDocument {
  const issuer = issuerFromSnapshot(p, letterhead);
  const taxTotal = num(p.taxAmount);
  const issueDate = p.issueDate || p.createdAt || p.validUntil || new Date().toISOString();
  const data: BusinessDocumentData = {
    meta: {
      type: "quote",
      titleOverride: "PROFORMA INVOICE",
      documentNumber: p.proformaNumber,
      issueDate,
      dueDate: p.validUntil ?? undefined,
      status: {
        label: PROFORMA_STATUS_LABELS[p.status],
        tone: PROFORMA_TONE[p.status],
      },
    },
    issuer,
    recipient: recipientFrom(p),
    items: lineItemsFrom(p.lines, taxTotal > 0),
    totals: {
      subtotal: num(p.subtotalAmount),
      taxes: taxTotal > 0 ? [{ label: "Tax", amount: taxTotal }] : undefined,
      discount:
        num(p.discountAmount) > 0
          ? { label: "Discount", amount: num(p.discountAmount) }
          : undefined,
      total: num(p.totalAmount),
      amountDue: num(p.totalAmount),
    },
    currency: p.currencyCode || DEFAULT_CURRENCY,
    notes: clean(p.notes),
    footerMessage: "This is a proforma invoice and is not a tax invoice.",
  };
  return {
    data,
    theme: invoicingTheme(letterhead),
    documentTitle: `${issuerDisplayName(issuer)} - Proforma Invoice`,
  };
}

// ── Invoice / receipt ─────────────────────────────────────────────────

const PAYMENT_TONE: Record<InvoicePaymentStatus, DocumentTone> = {
  UNPAID: "danger",
  PARTIALLY_PAID: "warning",
  PAID: "success",
};

export interface InvoiceDocumentSource extends IssuerSnapshotSource, CustomerSource {
  invoiceNumber: string;
  status: InvoiceStatus;
  paymentStatus: InvoicePaymentStatus;
  currencyCode?: string | null;
  issueDate: string;
  dueDate?: string | null;
  lines: LineSource[];
  subtotalAmount?: number | null;
  discountAmount?: number | null;
  taxAmount?: number | null;
  totalAmount?: number | null;
  paidAmount?: number | null;
  paymentDetailsText?: string | null;
  paymentInstructionsText?: string | null;
  taxLabel?: string | null;
}

export interface InvoiceDocumentOptions {
  letterhead?: LocationLetterhead | null;
  /** Payments recorded so far (rendered under the totals). */
  payments?: PaymentSource[] | null;
}

function invoiceStatusBadge(inv: InvoiceDocumentSource) {
  if (inv.status === "VOIDED") return { label: "Voided", tone: "neutral" as const };
  if (isInvoiceOverdue(inv)) return { label: "Overdue", tone: "danger" as const };
  return {
    label: INVOICE_PAYMENT_STATUS_LABELS[inv.paymentStatus],
    tone: PAYMENT_TONE[inv.paymentStatus],
  };
}

function invoiceNotes(inv: InvoiceDocumentSource): string | undefined {
  const notes = [inv.paymentInstructionsText, inv.paymentDetailsText]
    .map(clean)
    .filter(Boolean)
    .join("\n\n");
  return notes || undefined;
}

function invoiceTotals(inv: InvoiceDocumentSource, payments: PaymentRecord[]) {
  const total = num(inv.totalAmount);
  const paid = num(inv.paidAmount);
  const taxTotal = num(inv.taxAmount);
  return {
    subtotal: num(inv.subtotalAmount),
    taxes: taxTotal > 0 ? [{ label: inv.taxLabel?.trim() || "Tax", amount: taxTotal }] : undefined,
    discount:
      num(inv.discountAmount) > 0
        ? { label: "Discount", amount: num(inv.discountAmount) }
        : undefined,
    total,
    // Fall back to one aggregate line when the caller has the paid figure
    // but not the individual payments (older public payloads).
    payments:
      payments.length > 0
        ? payments
        : paid > 0
          ? [{ date: inv.issueDate, method: "Payments received", amount: paid }]
          : undefined,
    amountDue: Math.max(0, total - paid),
  };
}

/**
 * The INVOICE. Letterhead, customer and lines are the frozen snapshot; the
 * payment rows and balance are whatever has been recorded so far — the same
 * document shows the invoice being settled, then fully paid.
 */
export function buildInvoiceDocument(
  inv: InvoiceDocumentSource,
  opts: InvoiceDocumentOptions = {},
): InvoicingDocument {
  const issuer = issuerFromSnapshot(inv, opts.letterhead);
  const payments = paymentRecordsFrom(opts.payments, inv.issueDate);
  const data: BusinessDocumentData = {
    meta: {
      type: "invoice",
      documentNumber: inv.invoiceNumber,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate ?? undefined,
      status: invoiceStatusBadge(inv),
    },
    issuer,
    recipient: recipientFrom(inv),
    items: lineItemsFrom(inv.lines, num(inv.taxAmount) > 0),
    totals: invoiceTotals(inv, payments),
    currency: inv.currencyCode || DEFAULT_CURRENCY,
    notes: invoiceNotes(inv),
    footerMessage: "Thank you for your business and continued support",
  };
  return {
    data,
    theme: invoicingTheme(opts.letterhead),
    documentTitle: `${issuerDisplayName(issuer)} - Invoice`,
  };
}

/**
 * The RECEIPT for an invoice: the same lines, the payments received, and the
 * balance still open (zero once fully paid). Used for the authenticated
 * "Print receipt" as soon as any payment is in, and for the public receipt
 * link once the invoice is PAID.
 */
export function buildReceiptDocument(
  inv: InvoiceDocumentSource,
  opts: InvoiceDocumentOptions = {},
): InvoicingDocument {
  const issuer = issuerFromSnapshot(inv, opts.letterhead);
  const payments = paymentRecordsFrom(opts.payments, inv.issueDate);
  const paidInFull = inv.paymentStatus === "PAID";
  const lastPaymentDate =
    payments.length > 0 ? payments[payments.length - 1].date : inv.issueDate;
  const data: BusinessDocumentData = {
    meta: {
      type: "receipt",
      documentNumber: inv.invoiceNumber,
      referenceNumber: `Invoice ${inv.invoiceNumber}`,
      issueDate: lastPaymentDate,
      status: paidInFull
        ? { label: "Paid", tone: "success" }
        : { label: "Part payment", tone: "warning" },
    },
    issuer,
    recipient: recipientFrom(inv),
    items: lineItemsFrom(inv.lines, num(inv.taxAmount) > 0),
    totals: invoiceTotals(inv, payments),
    currency: inv.currencyCode || DEFAULT_CURRENCY,
    footerMessage: paidInFull
      ? "Thank you for your payment"
      : "Thank you for your payment — the balance above remains due",
  };
  return {
    data,
    theme: invoicingTheme(opts.letterhead),
    documentTitle: `${issuerDisplayName(issuer)} - Receipt`,
  };
}
