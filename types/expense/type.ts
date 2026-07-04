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
  DRAFT: "bg-gray-100 text-gray-700",
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
  VOIDED: "bg-gray-100 text-gray-500",
};

export const PAYMENT_STATUS_TONES: Record<PaymentStatus, string> = {
  UNPAID: "bg-red-50 text-red-700",
  PARTIALLY_PAID: "bg-amber-50 text-amber-700",
  PAID: "bg-green-50 text-green-700",
};
