/**
 * Loans / Financing types.
 *
 * This is a NEW product area ("Settlo Loans") and the backend financing
 * service does not exist yet — the server actions in
 * `lib/actions/loans-actions.ts` currently return typed mock data sourced
 * from `lib/loans/mock-data.ts`. These interfaces are the contract the real
 * service is expected to mirror, so swapping the stub for live endpoints is a
 * small change (see {@link ../../lib/actions/loans-client.ts}).
 *
 * Conventions (matching the rest of the dashboard / Accounting service):
 *  - Money is a plain JSON number in the loan's `currencyCode` (TZS by default).
 *  - `*Date` / `*At` string fields are `LocalDate` → "yyyy-MM-dd".
 *  - `paidPct` and a handful of other fields are *derived*; the server is
 *    authoritative, but we keep the math here so the UI and the mock agree.
 */

// ── Enums ─────────────────────────────────────────────────────────────

export type LoanProductKey =
  | "DEVICE_FINANCING"
  | "STOCK_LOAN"
  | "WORKING_CAPITAL";

/**
 * Lifecycle. A facility is `IN_REVIEW` right after application, becomes
 * `ACTIVE` once disbursed, then `PAID` when cleared. `OVERDUE` is derived
 * (a `DUE` installment whose date has passed) and `REJECTED` ends a
 * declined application.
 */
export type LoanStatus =
  | "ACTIVE"
  | "PAID"
  | "PENDING"
  | "IN_REVIEW"
  | "OVERDUE"
  | "REJECTED";

/** A single row of the repayment schedule. */
export type RepaymentState = "PAID" | "DUE" | "UPCOMING" | "MISSED";

export type DisbursementChannel =
  | "MPESA"
  | "TIGO_PESA"
  | "AIRTEL_MONEY"
  | "BANK";

/** How the facility fee is charged. */
export type LoanFeeType = "FLAT" | "MONTHLY";

// ── Product catalogue ─────────────────────────────────────────────────

export interface LoanProduct {
  key: LoanProductKey;
  name: string;
  /** One-line "what it's for". */
  description: string;
  minAmount: number;
  maxAmount: number;
  feeType: LoanFeeType;
  /** Fraction, e.g. 0.05 for 5%. */
  feeRate: number;
  /** Selectable repayment terms in months. */
  termOptionsMonths: number[];
}

export const LOAN_PRODUCTS: Record<LoanProductKey, LoanProduct> = {
  DEVICE_FINANCING: {
    key: "DEVICE_FINANCING",
    name: "Device financing",
    description: "Spread the cost of POS terminals & hardware.",
    minAmount: 150_000,
    maxAmount: 1_200_000,
    feeType: "FLAT",
    feeRate: 0.04,
    termOptionsMonths: [3, 6, 9, 12],
  },
  STOCK_LOAN: {
    key: "STOCK_LOAN",
    name: "Stock loan",
    description: "Short-term credit to restock inventory.",
    minAmount: 300_000,
    maxAmount: 3_000_000,
    feeType: "MONTHLY",
    feeRate: 0.03,
    termOptionsMonths: [1, 2, 3, 4],
  },
  WORKING_CAPITAL: {
    key: "WORKING_CAPITAL",
    name: "Working capital",
    description: "Flexible cash for day-to-day operations.",
    minAmount: 500_000,
    maxAmount: 6_500_000,
    feeType: "FLAT",
    feeRate: 0.05,
    termOptionsMonths: [3, 6, 9, 12],
  },
};

export const LOAN_PRODUCT_KEYS = Object.keys(
  LOAN_PRODUCTS,
) as LoanProductKey[];

export const DISBURSEMENT_LABELS: Record<DisbursementChannel, string> = {
  MPESA: "M-Pesa",
  TIGO_PESA: "Tigo Pesa",
  AIRTEL_MONEY: "Airtel Money",
  BANK: "Bank transfer",
};

// ── Domain models ─────────────────────────────────────────────────────

export interface RepaymentScheduleItem {
  number: number;
  /** "yyyy-MM-dd" */
  dueDate: string;
  amount: number;
  state: RepaymentState;
  /** "yyyy-MM-dd" — set once paid. */
  paidOn?: string | null;
}

export interface Loan {
  id: string;
  /** Human reference, e.g. "LN-004821". */
  reference: string;
  productKey: LoanProductKey;
  productName: string;
  status: LoanStatus;
  currencyCode: string;
  // Money
  principal: number;
  facilityFee: number;
  /** Human label for the fee, e.g. "5% flat" / "3% / mo". */
  feeLabel: string;
  totalRepayable: number;
  outstanding: number;
  repaidAmount: number;
  // Term / installments
  termMonths: number;
  installmentAmount: number;
  paidInstallments: number;
  totalInstallments: number;
  onTimeInstallments?: number | null;
  nextPaymentDate?: string | null;
  nextPaymentAmount?: number | null;
  // Lifecycle
  startedAt: string;
  closedAt?: string | null;
  // Disbursement / repayment source
  disbursementChannel: DisbursementChannel;
  /** Masked account, e.g. "··· 8317". */
  disbursementAccountMask?: string | null;
  autoDeduct: boolean;
  /** Present on the detail fetch; omitted from the list. */
  schedule?: RepaymentScheduleItem[];
  /** Derived 0–100. */
  paidPct: number;
}

export interface LoanEligibility {
  currencyCode: string;
  /** Pre-qualified ceiling. */
  limit: number;
  /** Borrowable right now (0 while a facility is active). */
  available: number;
  /** null = no repayment history yet (new borrower). */
  onTimeRatePct: number | null;
  loansRepaid: number;
  /** Free-form, e.g. "2024"; null = unknown / new. */
  customerSince: string | null;
  hasActiveLoan: boolean;
  activeLoanId?: string | null;
  /**
   * `QUALIFIED` — pre-qualified, show {@link EligibilityHero}. `BUILDING` —
   * not there yet but making progress, show the building-eligibility card
   * (see `building`). `INELIGIBLE` — nothing to show.
   */
  eligibilityStatus: "QUALIFIED" | "BUILDING" | "INELIGIBLE";
  /** Populated only when `eligibilityStatus === "BUILDING"`. */
  building?: BuildingProgress | null;
}

/** A single row of the building-eligibility checklist. */
export interface BuildProgressItem {
  key: string;
  label: string;
  detail: string;
  state: "done" | "prog" | "todo";
  pct: number;
}

/** Progress-toward-qualifying snapshot for a not-yet-eligible merchant. */
export interface BuildingProgress {
  /** Estimated limit once qualified; null if not yet estimable. */
  projectedLimit: number | null;
  /** Overall progress toward qualifying, 0–100. */
  eligibilityPct: number;
  checklist: BuildProgressItem[];
  /** Estimated active trading days remaining to reach target; null if unknown. */
  daysToTarget: number | null;
}

/** Result of submitting an application (mock + future backend). */
export interface LoanApplicationResult {
  reference: string;
  status: LoanStatus;
  submittedAt: string;
}

// ── Labels & tones (Tailwind classes — dashboard design tokens) ───────

export const LOAN_STATUS_LABELS: Record<LoanStatus, string> = {
  ACTIVE: "Active",
  PAID: "Paid off",
  PENDING: "Pending",
  IN_REVIEW: "In review",
  OVERDUE: "Overdue",
  REJECTED: "Declined",
};

export const LOAN_STATUS_TONES: Record<LoanStatus, string> = {
  ACTIVE: "bg-pos-tint text-pos",
  PAID: "bg-canvas text-ink-3",
  PENDING: "bg-warn-tint text-warn",
  IN_REVIEW: "bg-primary-light text-primary-dark",
  OVERDUE: "bg-neg-tint text-neg",
  REJECTED: "bg-neg-tint text-neg",
};

export const REPAYMENT_STATE_LABELS: Record<RepaymentState, string> = {
  PAID: "Paid",
  DUE: "Due",
  UPCOMING: "Upcoming",
  MISSED: "Missed",
};

// ── Helpers ───────────────────────────────────────────────────────────

/** "TZS 3,000,000" — design-style currency prefix. */
export function formatTzs(
  amount: number | null | undefined,
  currency = "TZS",
): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  return `${currency} ${Math.round(amount).toLocaleString()}`;
}

/** Compact form: 3_000_000 → "3M", 275_000 → "275K". */
export function formatTzsShort(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  const n = Math.abs(amount);
  if (n >= 1_000_000) {
    const m = amount / 1_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (n >= 1_000) return `${Math.round(amount / 1_000)}K`;
  return `${Math.round(amount)}`;
}

export function loanProgressPct(loan: {
  totalRepayable: number;
  repaidAmount: number;
}): number {
  if (!loan.totalRepayable) return 0;
  return Math.min(
    100,
    Math.max(0, Math.round((loan.repaidAmount / loan.totalRepayable) * 100)),
  );
}

export const isLoanActive = (s: LoanStatus): boolean =>
  s === "ACTIVE" || s === "OVERDUE";

export const isLoanClosed = (s: LoanStatus): boolean =>
  s === "PAID" || s === "REJECTED";

/** Build the human fee label for a product. */
export function feeLabelFor(product: LoanProduct): string {
  const pct = +(product.feeRate * 100).toFixed(2);
  return product.feeType === "FLAT" ? `${pct}% flat` : `${pct}% / mo`;
}

export interface LoanQuote {
  productKey: LoanProductKey;
  amount: number;
  termMonths: number;
  facilityFee: number;
  totalRepayable: number;
  monthlyPayment: number;
  feeLabel: string;
}

/**
 * Live repayment preview used by the application flow. Self-consistent (the
 * monthly payment is exactly total ÷ term) — the design mock's illustrative
 * numbers are intentionally not reproduced where they didn't reconcile.
 */
export function computeLoanQuote(
  productKey: LoanProductKey,
  amount: number,
  termMonths: number,
): LoanQuote {
  const product = LOAN_PRODUCTS[productKey];
  const amt = Math.max(0, Number(amount) || 0);
  const term = Math.max(1, Number(termMonths) || 1);
  const facilityFee =
    product.feeType === "FLAT"
      ? amt * product.feeRate
      : amt * product.feeRate * term;
  const totalRepayable = amt + facilityFee;
  const monthlyPayment = Math.round(totalRepayable / term);
  return {
    productKey,
    amount: amt,
    termMonths: term,
    facilityFee: Math.round(facilityFee),
    totalRepayable: Math.round(totalRepayable),
    monthlyPayment,
    feeLabel: feeLabelFor(product),
  };
}
