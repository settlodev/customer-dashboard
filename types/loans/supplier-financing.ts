/**
 * Supplier-financing (LPO post-acceptance) types — mirror the Loan Management
 * Service's borrower-safe supplier-financing DTOs exactly (field names and
 * nullability), per the 2026-08-03 LPO-financing design.
 *
 * Source DTOs:
 *  - `SupplierFinancingEligibility` mirrors the LMS's
 *    `SupplierFinancingEligibilityResponse` (GET
 *    /api/v1/supplier-financing/eligibility?lpoId=). `eligible` is a
 *    TRI-state: true/false is a fresh check outcome; null means an
 *    application already exists — resume from `existingApplicationId`
 *    instead of re-checking.
 *  - `SupplierFinancingQuote` mirrors its nested `quote` block (present only
 *    when eligible).
 *  - `FinancingTermsStatus` mirrors the LMS financing-terms response
 *    (GET /api/v1/financing-terms → { currentVersion, accepted, acceptedAt }).
 *
 * Conventions: money is a plain JSON number (BigDecimal); dates are ISO
 * strings; UUIDs are strings.
 */

export interface SupplierFinancingQuote {
  /** Full order total — the new flow is full-order financing only (D6). */
  financedAmount: number;
  feeAmount: number;
  /** Fraction of principal (0.05 = 5%) — same convention as the LMS's
   *  `LoanProduct.flatFeeRate`. Render via {@link formatFeeRate}. */
  feeRate: number;
  termDays: number;
  totalRepayable: number;
  /** today + termDays; the real due date is fixed at disbursement. */
  indicativeDueDate: string;
  currency: string;
  availableLimit: number;
  limitAfter: number;
}

export interface SupplierFinancingEligibility {
  /** true/false = fresh check outcome; null = application already exists. */
  eligible: boolean | null;
  /** Machine code for the none-state (e.g. supplier not financeable). */
  reasonCode: string | null;
  /** Merchant-friendly text for the none-state. */
  reason: string | null;
  /** Present only when `eligible === true`. */
  quote: SupplierFinancingQuote | null;
  /** Set when `eligible === null` — resume the flow from this application. */
  existingApplicationId: string | null;
  applicationStatus: string | null;
}

export interface FinancingTermsStatus {
  currentVersion: string;
  /** Whether the caller's ACCOUNT accepted `currentVersion` (account-level fact). */
  accepted: boolean;
  acceptedAt: string | null;
}

/**
 * LMS wire codes for the supplier-product accept gates (spec §4.4). The LMS
 * serializes error codes as "ERR-xxxx" strings (see its
 * common/error/ErrorCodes.java), NOT constant names — keep these in sync
 * with that file. Allocated as the next free ERR-62xx slots after
 * OFFER_EXPIRED = ERR-6211.
 */
export const SUPPLIER_FINANCING_GATE_CODES = {
  TERMS_NOT_ACCEPTED: "ERR-6212",
  TERMS_VERSION_STALE: "ERR-6213",
  PHONE_NOT_VERIFIED: "ERR-6214",
  /** Accounts kyc-status unreachable — RETRYABLE: back off ≤10s total (spec §4.4). */
  PHONE_VERIFICATION_UNAVAILABLE: "ERR-6215",
} as const;

/** 0.05 → "5%", 0.125 → "12.5%". Null-safe for defensive rendering. */
export function formatFeeRate(feeRate: number | null | undefined): string {
  if (feeRate == null || Number.isNaN(feeRate)) return "—";
  const pct = feeRate * 100;
  return `${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1)}%`;
}
