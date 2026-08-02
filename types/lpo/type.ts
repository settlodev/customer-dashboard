import type { DestinationType } from "@/types/catalogue/enums";

// ── Status enum (matches backend exactly — no SENT) ────────────────

export type LpoStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELLED";

export type SupplierAcknowledgement = "PENDING" | "ACCEPTED" | "REJECTED";

// ── Financing (pay-via-Settlo) ───────────────────────────────────────
// Mirrors the Inventory Service's `LpoPaymentMethod` / `OrderFinancingStatus`
// enums (co.tz.settlo.inventory.lpo.enums / .supplierorder.enums).

/** How an LPO is settled with the supplier. DIRECT unless financing was requested. */
export type LpoPaymentMethod = "DIRECT" | "SETTLO_FINANCING";

/**
 * Read-through financing state — `NONE` for DIRECT LPOs, derived from the
 * shadow supplier order once minted, or the terminal `DECLINED` state when
 * the supplier accepted but no shadow order was ever minted.
 */
export type OrderFinancingStatus =
  | "NONE"
  | "REQUESTED"
  | "OFFER_MADE"
  | "DECLINED"
  | "PAID";

export const FINANCING_STATUS_LABELS: Record<OrderFinancingStatus, string> = {
  NONE: "—",
  REQUESTED: "Underwriting",
  OFFER_MADE: "Offer ready",
  DECLINED: "Declined",
  PAID: "Paid by Settlo",
};

// ── Entities ───────────────────────────────────────────────────────

export interface Lpo {
  id: string;
  lpoNumber: string;
  supplierId: string;
  locationType: DestinationType;
  locationId: string;
  status: LpoStatus;
  /** LPO-level primary currency — inferred from the first item. Line-level
   *  `items[].currency` is authoritative when items span multiple currencies. */
  currency: string | null;
  notes: string | null;
  /** Opaque token issued when the LPO first enters APPROVED. Used by the
   *  supplier-facing public share URL — null until then. */
  shareToken: string | null;
  shareTokenIssuedAt: string | null;
  supplierAcknowledgement: SupplierAcknowledgement;
  acknowledgedAt: string | null;
  acknowledgementNote: string | null;
  /** Null when the supplier acknowledged via the share link themselves;
   *  populated with the staff UUID when an internal user recorded acceptance
   *  on the supplier's behalf. */
  acknowledgedByStaffId: string | null;
  /** Display name resolved from the staff reference cache. */
  acknowledgedByStaffName: string | null;
  /** Staff member who created the LPO (captured at create-time from the auth context). */
  createdBy: string | null;
  /** Display name for `createdBy`. */
  createdByName: string | null;
  items: LpoItem[];
  createdAt: string;
  updatedAt: string;

  /** How this LPO is settled with the supplier; DIRECT unless pay-via-Settlo financing was requested. */
  paymentMethod?: LpoPaymentMethod;
  /**
   * Settlo-financed share of the order total. `null` means FULL financing on a
   * SETTLO_FINANCING LPO — render the LPO's total client-side in that case; the
   * wire deliberately does not substitute it here. Always `null` on a DIRECT LPO.
   */
  financedAmount?: number | null;
  /**
   * What the merchant themself owes the supplier after any Settlo financing:
   * `total - financedAmount` when a partial amount was requested, `0` when
   * `financedAmount` is null on a SETTLO_FINANCING LPO (full financing), or
   * `null` on a DIRECT LPO (not applicable).
   */
  merchantPayableAmount?: number | null;
  /** Derived financing state — see {@link OrderFinancingStatus}. */
  financingStatus?: OrderFinancingStatus | null;
  /** Shadow SupplierOrder id minted on supplier acceptance of a financed LPO, once it exists. */
  supplierOrderId?: string | null;
  /** Loan application backing the shadow order's financing, resolved from that order once minted. */
  loanApplicationId?: string | null;
}

// ── Public (supplier-facing) view served by the share link ─────────

export interface PublicLpoItem {
  variantName: string | null;
  orderedQuantity: number;
  unitCost: number;
  currency: string | null;
  lineTotal: number | null;
}

export interface PublicLpo {
  lpoNumber: string;
  supplierAcknowledgement: SupplierAcknowledgement;
  acknowledgedAt: string | null;
  acknowledgementNote: string | null;
  supplierName: string | null;
  supplierContactPersonName: string | null;
  supplierContactPersonPhone: string | null;
  supplierPhone: string | null;
  supplierEmail: string | null;
  supplierAddress: string | null;
  supplierRegistrationNumber: string | null;
  supplierTinNumber: string | null;
  deliveryLocationName: string | null;
  notes: string | null;
  currency: string | null;
  totalAmount: number | null;
  /** How this LPO is settled — tells the supplier whether to expect direct payment or a Settlo-financed payout. */
  paymentMethod?: LpoPaymentMethod;
  /** Settlo-financed share of `totalAmount`. `null` means full financing on a SETTLO_FINANCING LPO, or the LPO is DIRECT. */
  financedAmount?: number | null;
  /** What the merchant will pay the supplier after Settlo's financed share (if any). `0` for full financing, `null` for DIRECT. */
  merchantPayableAmount?: number | null;
  items: PublicLpoItem[];
  issuedAt: string;
  letterhead: import("@/types/letterhead/type").LocationLetterhead | null;
}

export interface LpoItem {
  id: string;
  stockVariantId: string;
  variantName: string | null;
  orderedQuantity: number;
  receivedQuantity: number;
  unitCost: number;
  /** Supplier-quoted currency for this line. Preserved for GRN receive-time
   *  conversion to the location's base currency. */
  currency: string | null;
}

// ── Request payloads ───────────────────────────────────────────────

export interface CreateLpoItemPayload {
  stockVariantId: string;
  orderedQuantity: number;
  unitCost: number;
  currency?: string;
}

export interface CreateLpoPayload {
  supplierId: string;
  locationType: DestinationType;
  notes?: string;
  items: CreateLpoItemPayload[];
  /** Null/omitted defaults to DIRECT server-side — only SETTLO_FINANCING triggers the financing-eligibility checks. */
  paymentMethod?: LpoPaymentMethod;
  /** Only meaningful with paymentMethod SETTLO_FINANCING. Omitted requests full financing of the order. */
  financedAmount?: number;
}

export interface UpdateLpoStatusPayload {
  status: LpoStatus;
}

export interface AcknowledgeLpoPayload {
  decision: Exclude<SupplierAcknowledgement, "PENDING">;
  note?: string;
}

// ── Display helpers ────────────────────────────────────────────────

export const LPO_STATUS_LABELS: Record<LpoStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  PARTIALLY_RECEIVED: "Partially Received",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
};

export const LPO_STATUS_TONES: Record<LpoStatus, string> = {
  DRAFT: "bg-gray-50 text-gray-700",
  SUBMITTED: "bg-blue-50 text-blue-700",
  APPROVED: "bg-indigo-50 text-indigo-700",
  PARTIALLY_RECEIVED: "bg-amber-50 text-amber-700",
  RECEIVED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};

export const SUPPLIER_ACK_LABELS: Record<SupplierAcknowledgement, string> = {
  PENDING: "Awaiting supplier",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

export const SUPPLIER_ACK_TONES: Record<SupplierAcknowledgement, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  ACCEPTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

/** LPOs whose goods can still be received — used by GRN LPO picker. */
export const OPEN_LPO_STATUSES: LpoStatus[] = ["APPROVED", "PARTIALLY_RECEIVED"];

/**
 * State-machine transitions allowed by the backend. Mirrors
 * {@code LpoService.validateStatusTransition}. CANCELLED is allowed from any
 * state except RECEIVED — encoded separately for clarity.
 */
export const LPO_NEXT_STATUSES: Record<LpoStatus, LpoStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["APPROVED"],
  APPROVED: ["PARTIALLY_RECEIVED", "RECEIVED"],
  PARTIALLY_RECEIVED: ["RECEIVED"],
  RECEIVED: [],
  CANCELLED: [],
};

/** True when the LPO can be cancelled — any status except RECEIVED/CANCELLED. */
export function canCancelLpo(status: LpoStatus): boolean {
  return status !== "RECEIVED" && status !== "CANCELLED";
}

/** True when the LPO can be soft-deleted. Only DRAFT, per backend. */
export function canDeleteLpo(status: LpoStatus): boolean {
  return status === "DRAFT";
}

/**
 * Combine the LPO's internal status with the supplier-side acknowledgement
 * into a single label + tone for the status pill.
 *
 * - APPROVED + PENDING → "Awaiting supplier" (amber)
 * - CANCELLED + REJECTED → "Rejected by supplier" (red) — the backend
 *   auto-cancels rejected orders, so this preserves the diagnostic signal
 *   that would otherwise be flattened to a generic "Cancelled" label.
 * - Everything else falls through to the regular status labels.
 */
export function effectiveLpoStatus(
  status: LpoStatus,
  ack: SupplierAcknowledgement,
): { label: string; tone: string } {
  if (status === "APPROVED" && ack === "PENDING") {
    return {
      label: "Awaiting supplier",
      tone: "bg-amber-50 text-amber-700",
    };
  }
  if (status === "CANCELLED" && ack === "REJECTED") {
    return {
      label: "Rejected by supplier",
      tone: "bg-red-50 text-red-700",
    };
  }
  return {
    label: LPO_STATUS_LABELS[status],
    tone: LPO_STATUS_TONES[status],
  };
}
