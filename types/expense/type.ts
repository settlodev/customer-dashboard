/**
 * Expense types — mirror the Accounting Service contract at
 * /api/v1/expenses. Status is the workflow state, paymentStatus is
 * the settlement state derived from posted ExpensePayment rows.
 */

export type ExpenseStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "VOIDED";

export type PaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID";

export interface Expense {
  id: string;
  slug: string;
  expenseNumber: string;
  vendorId?: string | null;
  expenseCategoryId?: string | null;
  chartOfAccountId?: string | null;
  description?: string | null;
  reference?: string | null;
  amount: number;
  taxAmount?: number | null;
  totalAmount: number;
  paidAmount: number;
  creditedAmount: number;
  balanceDue: number;
  currencyCode: string;
  exchangeRate?: number | null;
  expenseDate: string;
  dueDate?: string | null;
  daySessionId?: string | null;
  businessDate?: string | null;
  status: ExpenseStatus;
  paymentStatus: PaymentStatus;
  attachmentUrl?: string | null;
  createdByStaffId?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  locationId: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseTimelineEvent {
  id: string;
  expenseId: string;
  eventType: string;
  description?: string;
  metadata?: Record<string, unknown>;
  staffId?: string;
  staffName?: string;
  occurredAt: string;
}

export interface ExpenseAttachment {
  id: string;
  expenseId: string;
  fileName: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  url: string;
  createdAt: string;
}

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  DRAFT: "Draft",
  PENDING: "Pending approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  VOIDED: "Voided",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  PARTIALLY_PAID: "Partial",
  PAID: "Paid",
};

export const EXPENSE_STATUS_TONES: Record<ExpenseStatus, string> = {
  DRAFT: "bg-muted text-ink-2",
  PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  APPROVED: "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  REJECTED: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  CANCELLED: "bg-muted text-ink-3",
  VOIDED: "bg-muted text-ink-3",
};

export const PAYMENT_STATUS_TONES: Record<PaymentStatus, string> = {
  UNPAID: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  PARTIALLY_PAID: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  PAID: "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400",
};

// ── Close-of-Day session summary ──────────────────────────────────────
// GET /api/v1/reports/sessions/{sessionId}/expenses. Feeds the
// dashboard's Close-of-Day report — expenses recorded against a single
// day session, with the cash/mobile/other payment-method split.

/**
 * One posted payment against a session expense. Optional on the parent
 * item: a backend older than the payment-detail change omits the field
 * entirely, and the dashboard falls back to `paymentMethodCodes`.
 */
export interface DaySessionExpensePayment {
  paymentId: string;
  amount: number;
  currencyCode?: string | null;
  /** Free-text label captured at create time ("CASH · Cash on Hand"). */
  paymentMethod?: string | null;
  /** Preseeded Payments-Service code (CASH / MPESA / BANK_TRANSFER / …). */
  paymentMethodCode?: string | null;
  paymentMethodId?: string | null;
  /** Asset account the money actually left. */
  sourceAccountId?: string | null;
  sourceAccountName?: string | null;
  paymentDate?: string | null;
  reference?: string | null;
  notes?: string | null;
  recordedAt?: string | null;
}

export interface DaySessionExpenseItem {
  expenseId: string;
  expenseNumber: string;
  description?: string | null;
  expenseCategoryId?: string | null;
  categoryName?: string | null;
  payeeId?: string | null;
  payeeName?: string | null;
  payeeType?: string | null;
  /**
   * Backend badge string — UNPAID / PARTIALLY_PAID / PAID·CASH /
   * PAID·MOBILE / PAID·OTHER. NOT an `ExpenseStatus`; gate UI on
   * `paymentStatus` instead.
   */
  status: string;
  paymentStatus: PaymentStatus;
  paymentMethodCodes: string[];
  payments?: DaySessionExpensePayment[] | null;
  amount: number;
  paidAmount: number;
  balanceDue: number;
  currencyCode: string;
  reference?: string | null;
  expenseDate?: string | null;
  recordedAt?: string | null;
}

export interface DaySessionExpenseTotals {
  count: number;
  totalAmount: number;
  paidByCash: number;
  paidByMobile: number;
  paidByOther: number;
  unpaidTotal: number;
}

export interface DaySessionExpensesSummary {
  daySessionId: string;
  businessId: string;
  items: DaySessionExpenseItem[];
  totals: DaySessionExpenseTotals;
}
