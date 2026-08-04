/**
 * Borrower-facing loan APPLICATION types — mirror the Loan Management
 * Service's (`co.tz.settlo.lms`) borrower-safe DTOs exactly (field names and
 * nullability), not the internal admin projections in `types/admin/loans.ts`.
 *
 * Distinct from `types/loans/type.ts`, which models the loan BOOK (mock-backed
 * pending `FINANCING_BACKEND_READY`). This file's actions (see
 * `lib/actions/loan-applications-actions.ts`) call the live LMS directly.
 *
 * Source DTOs:
 *  - `LoanApplication` mirrors `CustomerApplicationResponse`
 *    (lms/application/dto/CustomerApplicationResponse.java). That DTO
 *    deliberately excludes internal underwriting fields (risk grade, the raw
 *    `rejectionReason` / `decisionNotes`, sanctions detail) — `declineReason`
 *    is a translated, borrower-safe substitute (null unless REJECTED), and it
 *    carries no `createdAt`. Don't add those fields back here; they're not on
 *    the wire.
 *  - `PreQualifiedProduct` mirrors `PreQualifiedProductResponse`
 *    (lms/prequalification/dto/PreQualifiedProductResponse.java).
 *
 * Conventions: money is a plain JSON number (BigDecimal); `*Days` are plain
 * ints; UUID fields are strings.
 */

// ── Application status ──────────────────────────────────────────────
// Mirrors the LMS's shared `ApplicationStatus` enum (co.tz.settlo.lms.common.enums)
// — the full 9-value union. Note COMPLIANCE_HOLD is masked to IN_REVIEW by
// CustomerApplicationMapper before it ever reaches a borrower response (AML
// no-tipping-off), so in practice this DTO's `status` never actually reads
// COMPLIANCE_HOLD — it's kept in the union for type fidelity with the shared
// backend enum, with a label/tone matching IN_REVIEW should that ever change.

export type ApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "COMPLIANCE_HOLD"
  | "IN_REVIEW"
  | "APPROVED"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN"
  | "EXPIRED";

/** Borrower-friendly wording (softer than the admin queue's plain status labels). */
export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  COMPLIANCE_HOLD: "In review",
  IN_REVIEW: "In review",
  APPROVED: "Offer ready",
  ACCEPTED: "Accepted",
  REJECTED: "Declined",
  WITHDRAWN: "Withdrawn",
  EXPIRED: "Expired",
};

/** Semantic badge tokens — same raw-Tailwind convention as `types/admin/loans.ts`. */
export const APPLICATION_STATUS_TONES: Record<ApplicationStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-orange-50 text-orange-700",
  COMPLIANCE_HOLD: "bg-amber-50 text-amber-700",
  IN_REVIEW: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  ACCEPTED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
  WITHDRAWN: "bg-gray-100 text-gray-500",
  EXPIRED: "bg-gray-100 text-gray-500",
};

// ── Application ──────────────────────────────────────────────────────

/**
 * Re-quoted offer economics on an APPROVED supplier-product application —
 * mirrors the `offerQuote` block the LMS adds to
 * `CustomerApplicationResponse` on `GET /api/v1/loan-applications/mine/{id}`
 * (re-quoted via `LoanQuoteEngine` on read). Null/absent for non-approved
 * states and non-supplier products.
 */
export interface OfferQuote {
  financedAmount: number;
  feeAmount: number;
  /** Fraction of principal (0.05 = 5%) — same convention as `SupplierFinancingQuote.feeRate`. */
  feeRate: number;
  termDays: number;
  totalRepayable: number;
  indicativeDueDate: string;
  offerExpiresAt: string;
}

/** Mirrors the LMS's `CustomerApplicationResponse` — see file header for what's deliberately excluded. */
export interface LoanApplication {
  id: string;
  applicationNumber: string;
  businessId: string;
  /** Null only on system-rejected supplier-financing declines (no product qualified). */
  loanProductId: string | null;
  requestedAmount: number;
  /** Null only on system-rejected supplier-financing declines (no term was selected). */
  requestedTermDays: number | null;
  purpose: string | null;
  status: ApplicationStatus;
  approvedAmount: number | null;
  approvedTermDays: number | null;
  /** The borrower's qualified ceiling from the latest credit assessment — safe to show, it's their own number. */
  recommendedLimit: number | null;
  /** Translated, borrower-facing decline explanation. Null unless `status === "REJECTED"`. */
  declineReason: string | null;
  kycVerified: boolean | null;
  /** Set once the offer is accepted and a loan is booked. */
  loanId: string | null;
  borrowerPhone: string | null;
  borrowerEmail: string | null;
  /** Set for a supplier-financed (order-first) stock loan — the Inventory supplier order this application finances. */
  supplierOrderId: string | null;
  settloSupplierId: string | null;
  /** See {@link OfferQuote}. Optional (`?`) because pre-rollout LMS responses omit the key entirely. */
  offerQuote?: OfferQuote | null;
}

// ── Pre-qualification catalog ───────────────────────────────────────

/** Coarse, customer-safe projection of the underwriting outcome — mirrors the LMS's `IndicativeDecision` enum. */
export type IndicativeDecision =
  | "LIKELY_APPROVED"
  | "NEEDS_REVIEW"
  | "NOT_QUALIFIED";

/**
 * One PUBLISHED loan product's qualified ceiling for the caller's business —
 * "what do I qualify for, before I apply?". Mirrors the LMS's
 * `PreQualifiedProductResponse`, which deliberately excludes the underlying
 * `QualificationPolicy`, raw credit score/default probability, risk grade,
 * and internal decision-reason codes.
 */
export interface PreQualifiedProduct {
  productId: string;
  code: string;
  name: string;
  /**
   * LoanProductType code (currently `POS_DEVICE` | `STOCK` | `BUSINESS_IMPROVEMENT`)
   * — the LMS DTO itself wire-types this as a plain string rather than the
   * enum, so it's left loose here rather than duplicating that union.
   */
  productType: string;
  currency: string;
  minPrincipal: number;
  maxPrincipal: number;
  minTermDays: number;
  maxTermDays: number;
  /** The evaluate() ceiling (recommendedLimit); null if NOT_QUALIFIED on a hard gate. */
  qualifiedAmount: number | null;
  indicativeDecision: IndicativeDecision;
  /** True when the product's policy requires KYC beyond NONE — a to-do the merchant can complete. */
  kycRequired: boolean;
}
