/**
 * AR Invoicing types — mirror the Accounting Service contract under
 * `co.tz.settlo.accounting.invoicing` (Proforma → Invoice → Payment) and
 * `…/public/ar/*` (customer-facing share/accept).
 *
 * Conventions on the wire:
 *  - Money is `BigDecimal` serialised as a JSON number (proforma/invoice
 *    scale 4). `taxRate` is a *fraction* (0.18 = 18%), scale 6.
 *  - `*Date` fields are `LocalDate` → "yyyy-MM-dd".
 *  - `*At` fields are `OffsetDateTime` → ISO-8601 with offset.
 *
 * There is no OVERDUE status server-side — it's derived client-side from
 * `dueDate` vs today on an unpaid, issued invoice (see {@link isInvoiceOverdue}).
 */

export type ProformaStatus =
  | "DRAFT"
  | "SENT"
  | "ACCEPTED"
  | "CONVERTED"
  | "DECLINED"
  | "EXPIRED"
  | "CANCELLED";

export type InvoiceStatus = "ISSUED" | "VOIDED";

export type InvoicePaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID";

// ── Proforma ──────────────────────────────────────────────────────────

export interface ProformaLine {
  id?: string;
  productId?: string | null;
  /** Catalogue variant quoted — what Inventory resolves the stock hold from. */
  productVariantId?: string | null;
  stockVariantId?: string | null;
  locationType?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  lineDiscountAmount?: number | null;
  /** Fraction, e.g. 0.18 for 18%. */
  taxRate?: number | null;
  taxInclusive: boolean;
  taxAmount?: number | null;
  lineSubtotal?: number | null;
  lineTotal?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Proforma {
  id: string;
  slug: string;
  proformaNumber: string;
  shareToken?: string | null;
  status: ProformaStatus;
  customerId: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerTin?: string | null;
  currencyCode: string;
  validUntil?: string | null;
  notes?: string | null;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  acceptedAt?: string | null;
  convertedInvoiceId?: string | null;
  locationId: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
  lines: ProformaLine[];
}

// ── Invoice ───────────────────────────────────────────────────────────

export interface InvoiceLine {
  id: string;
  productId?: string | null;
  /** Catalogue variant invoiced — what Inventory resolves the deduction from. */
  productVariantId?: string | null;
  stockVariantId?: string | null;
  locationType?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  lineDiscountAmount?: number | null;
  taxRate?: number | null;
  taxAmount?: number | null;
  lineSubtotal?: number | null;
  lineTotal?: number | null;
  taxInclusive: boolean;
  /** Null until the async COGS calculation lands from Inventory. */
  unitCost?: number | null;
  costAmount?: number | null;
}

export interface Invoice {
  id: string;
  slug: string;
  invoiceNumber: string;
  invoiceSeq?: number | null;
  shareToken?: string | null;
  sourceProformaId?: string | null;
  status: InvoiceStatus;
  paymentStatus: InvoicePaymentStatus;
  paidAmount: number;
  customerId: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerTin?: string | null;
  // Issuer snapshot — frozen onto the invoice at conversion from location
  // settings (any of these may be null if the settings cache is empty).
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
  paymentDetailsText?: string | null;
  paymentInstructionsText?: string | null;
  taxLabel?: string | null;
  currencyCode: string;
  issueDate: string;
  dueDate?: string | null;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  acceptedAt?: string | null;
  acceptedByName?: string | null;
  locationId: string;
  businessId: string;
  daySessionId?: string | null;
  businessDate?: string | null;
  createdAt: string;
  updatedAt: string;
  lines: InvoiceLine[];
}

export interface InvoicePayment {
  id: string;
  slug: string;
  invoiceId: string;
  amount: number;
  currencyCode: string;
  exchangeRate?: number | null;
  paymentDate: string;
  paymentMethod?: string | null;
  paymentMethodId?: string | null;
  paymentMethodCode?: string | null;
  sourceAccountId?: string | null;
  reference?: string | null;
  notes?: string | null;
  journalEntryId?: string | null;
  recordedByStaffId?: string | null;
  locationId: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoicingEvent {
  id: string;
  proformaId?: string | null;
  invoiceId?: string | null;
  eventType: string;
  actorId?: string | null;
  actorType?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  occurredAt: string;
  createdAt: string;
}

// ── Public (customer-facing) DTOs ─────────────────────────────────────

export interface PublicProformaLine {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface PublicProforma {
  proformaNumber: string;
  status: ProformaStatus;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerTin?: string | null;
  currencyCode: string;
  validUntil?: string | null;
  issueDate?: string | null;
  lines: PublicProformaLine[];
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string | null;
  // Issuer identity (resolved server-side from the business/location).
  businessName?: string | null;
  businessTin?: string | null;
  businessVrn?: string | null;
  locationName?: string | null;
  locationAddress?: string | null;
  // Issuer contact + locale — location-first, business as fallback (resolved
  // server-side). No country name upstream (business carries only a UUID).
  issuerPhone?: string | null;
  issuerEmail?: string | null;
  locationCity?: string | null;
  locationRegion?: string | null;
  issuerCountry?: string | null;
}

export interface PublicInvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface PublicArInvoice {
  invoiceNumber: string;
  status: InvoiceStatus;
  paymentStatus: InvoicePaymentStatus;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerTin?: string | null;
  currencyCode: string;
  issueDate: string;
  dueDate?: string | null;
  lines: PublicInvoiceLine[];
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  /** Only present once the invoice has been accepted. */
  paymentDetailsText?: string | null;
  paymentInstructionsText?: string | null;
  accepted: boolean;
  // Issuer snapshot frozen on the invoice.
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
}

// ── Labels & tones ────────────────────────────────────────────────────

export const PROFORMA_STATUS_LABELS: Record<ProformaStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  CONVERTED: "Converted",
  DECLINED: "Declined",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

export const PROFORMA_STATUS_TONES: Record<ProformaStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-50 text-blue-700",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  CONVERTED: "bg-green-50 text-green-700",
  DECLINED: "bg-red-50 text-red-700",
  EXPIRED: "bg-amber-50 text-amber-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  ISSUED: "Issued",
  VOIDED: "Voided",
};

export const INVOICE_STATUS_TONES: Record<InvoiceStatus, string> = {
  ISSUED: "bg-blue-50 text-blue-700",
  VOIDED: "bg-gray-100 text-gray-500",
};

export const INVOICE_PAYMENT_STATUS_LABELS: Record<
  InvoicePaymentStatus,
  string
> = {
  UNPAID: "Unpaid",
  PARTIALLY_PAID: "Partial",
  PAID: "Paid",
};

export const INVOICE_PAYMENT_STATUS_TONES: Record<
  InvoicePaymentStatus,
  string
> = {
  UNPAID: "bg-red-50 text-red-700",
  PARTIALLY_PAID: "bg-amber-50 text-amber-700",
  PAID: "bg-green-50 text-green-700",
};

export const PROFORMA_STATUS_FILTERS: { label: string; value: string }[] = (
  Object.keys(PROFORMA_STATUS_LABELS) as ProformaStatus[]
).map((s) => ({ label: PROFORMA_STATUS_LABELS[s], value: s }));

// ── State guards (match the server-side transition rules) ─────────────

export const isProformaEditable = (s: ProformaStatus): boolean =>
  s === "DRAFT" || s === "SENT";

export const isProformaShareable = (s: ProformaStatus): boolean =>
  s === "DRAFT" || s === "SENT";

export const isProformaCancellable = (s: ProformaStatus): boolean =>
  s === "DRAFT" || s === "SENT";

export const isProformaConvertible = (s: ProformaStatus): boolean =>
  s === "DRAFT" || s === "SENT" || s === "ACCEPTED";

export const isInvoiceOverdue = (inv: {
  status: InvoiceStatus;
  paymentStatus: InvoicePaymentStatus;
  dueDate?: string | null;
}): boolean => {
  if (inv.status !== "ISSUED" || inv.paymentStatus === "PAID") return false;
  if (!inv.dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(inv.dueDate) < today;
};

export const invoiceBalanceDue = (inv: {
  totalAmount: number;
  paidAmount: number;
}): number => Math.max(0, (inv.totalAmount ?? 0) - (inv.paidAmount ?? 0));

// ── Client-side totals preview (mirrors ProformaTotalsCalculator) ─────
// The server is authoritative; this only powers the live form preview.

const round4 = (n: number): number =>
  Math.round((n + Number.EPSILON) * 10000) / 10000;

export interface LineTotals {
  taxAmount: number;
  lineSubtotal: number;
  lineTotal: number;
}

/** `taxRate` here is a FRACTION (0.18), matching the backend. */
export function computeLineTotals(line: {
  quantity?: number | null;
  unitPrice?: number | null;
  lineDiscountAmount?: number | null;
  taxRate?: number | null;
  taxInclusive?: boolean | null;
}): LineTotals {
  const qty = Number(line.quantity) || 0;
  const price = Number(line.unitPrice) || 0;
  const discount = Number(line.lineDiscountAmount) || 0;
  const rate = Number(line.taxRate) || 0;
  const gross = qty * price;
  const net = gross - discount;
  if (line.taxInclusive) {
    const exTax = rate > 0 ? net / (1 + rate) : net;
    const taxAmount = net - exTax;
    return {
      taxAmount: round4(taxAmount),
      lineSubtotal: round4(exTax),
      lineTotal: round4(net),
    };
  }
  const taxAmount = net * rate;
  return {
    taxAmount: round4(taxAmount),
    lineSubtotal: round4(net),
    lineTotal: round4(net + taxAmount),
  };
}

export interface DocTotals {
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export function computeDocTotals(
  lines: Array<{
    quantity?: number | null;
    unitPrice?: number | null;
    lineDiscountAmount?: number | null;
    taxRate?: number | null;
    taxInclusive?: boolean | null;
  }>,
): DocTotals {
  return lines.reduce<DocTotals>(
    (acc, line) => {
      const t = computeLineTotals(line);
      return {
        subtotalAmount: round4(acc.subtotalAmount + t.lineSubtotal),
        discountAmount: round4(
          acc.discountAmount + (Number(line.lineDiscountAmount) || 0),
        ),
        taxAmount: round4(acc.taxAmount + t.taxAmount),
        totalAmount: round4(acc.totalAmount + t.lineTotal),
      };
    },
    { subtotalAmount: 0, discountAmount: 0, taxAmount: 0, totalAmount: 0 },
  );
}
