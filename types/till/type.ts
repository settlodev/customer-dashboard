export type CashMovementType =
  | "OPENING_FLOAT"
  | "PAY_IN"
  | "PAY_OUT"
  | "CLOSING_FLOAT";

export interface CashMovement {
  id: string;
  locationId: string;
  daySessionId: string;
  businessDate: string;
  currency: string;
  movementType: CashMovementType;
  amount: number;
  reference?: string | null;
  notes?: string | null;
  staffId?: string | null;
  occurredAt: string;
}

export type TillReconciliationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED";

export type VarianceReason =
  | "SHRINKAGE"
  | "MISCOUNT"
  | "PAID_TIPS"
  | "OTHER"
  | "NONE";

export interface TillReconciliation {
  id: string;
  locationId: string;
  daySessionId: string;
  businessDate: string;
  currency: string;
  openingFloat: number;
  countedCash: number;
  expectedCash: number;
  variance: number;
  denominations: Record<string, number>;
  status: TillReconciliationStatus;
  varianceReason?: VarianceReason | null;
  notes?: string | null;
  submittedBy?: string | null;
  submittedAt?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  journalEntryId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpectedCashBreakdown {
  sessionId: string;
  currency: string;
  openingFloat: number;
  cashSales: number;
  cashRefunds: number;
  cashExpenses: number;
  payIns: number;
  payOuts: number;
  expected: number;
}

export const TILL_STATUS_LABELS: Record<TillReconciliationStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const TILL_STATUS_TONES: Record<TillReconciliationStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-amber-50 text-amber-700",
  APPROVED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
};
