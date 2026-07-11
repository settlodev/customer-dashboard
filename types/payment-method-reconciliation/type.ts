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

/** Maps to the Badge component's tone variants. */
export const PM_RECON_STATUS_TONE: Record<
  PaymentMethodReconciliationStatus,
  "pos" | "neg" | "warn" | "soft"
> = {
  SUBMITTED: "warn",
  APPROVED: "pos",
  REJECTED: "neg",
};
