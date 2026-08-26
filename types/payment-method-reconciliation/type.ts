export type PaymentMethodReconciliationStatus =
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED";

/**
 * One payment method's end-of-day cash-up, from the Accounting Service
 * (`/api/v1/payment-method-reconciliations/by-session/{sessionId}`). The
 * cashier's close confirmation lands it SUBMITTED; a manager approves —
 * for offline mobile money a non-zero variance posts a Mobile Money
 * Over/Short to the ledger.
 */
export interface PaymentMethodReconciliation {
  id: string;
  locationId: string;
  daySessionId: string;
  businessDate: string;
  currency: string | null;
  paymentMethodId: string | null;
  paymentMethodCode: string | null;
  paymentMethodName: string | null;
  expectedAmount: number;
  countedAmount: number;
  variance: number;
  /**
   * Portion of expectedAmount that was tips / a customer prepayment,
   * rather than a completed sale. Purely informational — already
   * included in expectedAmount. Present once the Accounts Service ->
   * Accounting Service reconciliation event carries them; 0 otherwise.
   */
  expectedTip?: number;
  expectedPrepayment?: number;
  /**
   * Expenses paid OUT of this method during the session. NOT part of
   * `expectedAmount` (which is what was collected) — subtract it to get
   * what the tender should actually hold. Live while the row awaits
   * approval; the figure stamped at approval once approved. Absent on a
   * backend older than the expense-aware cash-up.
   */
  expensePaidAmount?: number | null;
  /**
   * `expectedAmount − expensePaidAmount` — what this tender should
   * actually hold at close, and what the cash-up presents as "expected".
   * `expectedAmount` alone is only what came IN.
   */
  expectedNet?: number | null;
  /**
   * `counted − expectedNet` — the real over/short and the figure the
   * approval journal posts. Differs from `variance` (the landed
   * `counted − collected`) whenever money was paid out of this method.
   */
  adjustedVariance?: number | null;
  expectedSource: string | null;
  triggerType: string | null;
  status: PaymentMethodReconciliationStatus;
  reconciledBy: string | null;
  reconciledAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  journalEntryId: string | null;
  /**
   * Server-resolved staff full names for `reconciledBy` / `approvedBy`,
   * looked up account-wide by the Accounting service (the actor may not be
   * in the dashboard's location-scoped roster — e.g. an owner approving).
   * Null when unresolvable; the UI falls back to a shortened id.
   */
  reconciledByName?: string | null;
  approvedByName?: string | null;
}

/**
 * Session totals struck by Accounting across every cash-up row — the
 * dashboard table, its KPI and the printed Z-report all render these
 * rather than re-adding the columns themselves, so no surface can drift
 * from another or from the over/short journal.
 */
export interface CashUpTotals {
  methodCount: number;
  pendingCount: number;
  approvedCount: number;
  /** What came IN across every method. */
  collected: number;
  /** What was paid back OUT (expense payments). */
  expensePaid: number;
  /** `collected − expensePaid` — what the tenders should hold. */
  expected: number;
  counted: number;
  /** `counted − expected` — the session's net over/short. */
  variance: number;
  /** False on a session that spent nothing; the Expenses column hides. */
  hasExpenses: boolean;
}

/** GET /api/v1/payment-method-reconciliations/by-session/{id}/cash-up */
export interface SessionCashUp {
  daySessionId: string;
  currency: string | null;
  methods: PaymentMethodReconciliation[];
  totals: CashUpTotals;
}

/**
 * Totals for cash-up rows that arrive WITHOUT a server-struck total —
 * only the public share snapshot, which embeds the bare row array (and,
 * for links issued before the expense-aware cash-up, rows with no
 * `expectedNet` either). Sums the server's own per-row figures; it
 * defines nothing itself.
 */
export const cashUpTotalsFrom = (
  rows: PaymentMethodReconciliation[],
): CashUpTotals => {
  const expectedNetOf = (r: PaymentMethodReconciliation) =>
    r.expectedNet ?? (r.expectedAmount ?? 0) - (r.expensePaidAmount ?? 0);
  const collected = rows.reduce((s, r) => s + (r.expectedAmount ?? 0), 0);
  const expensePaid = rows.reduce((s, r) => s + (r.expensePaidAmount ?? 0), 0);
  const expected = rows.reduce((s, r) => s + expectedNetOf(r), 0);
  const counted = rows.reduce((s, r) => s + (r.countedAmount ?? 0), 0);
  return {
    methodCount: rows.length,
    pendingCount: rows.filter((r) => r.status === "SUBMITTED").length,
    approvedCount: rows.filter((r) => r.status === "APPROVED").length,
    collected,
    expensePaid,
    expected,
    counted,
    variance: counted - expected,
    hasExpenses: expensePaid !== 0,
  };
};

/** Maps to the Badge component's tone variants. */
export const PM_RECON_STATUS_TONE: Record<
  PaymentMethodReconciliationStatus,
  "pos" | "neg" | "warn" | "soft"
> = {
  SUBMITTED: "warn",
  APPROVED: "pos",
  REJECTED: "neg",
};
