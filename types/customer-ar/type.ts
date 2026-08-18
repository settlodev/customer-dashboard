export type AgingBucket =
  | "CURRENT"
  | "DAYS_30"
  | "DAYS_60"
  | "DAYS_90"
  | "DAYS_90_PLUS";

export interface CustomerArBalance {
  customerId: string;
  customerName?: string | null;
  locationId: string;
  currency: string;
  totalCharged: number;
  totalSettled: number;
  outstandingBalance: number;
  outstandingOrderCount: number;
  oldestUnsettledAt?: string | null;
  lastChargeAt?: string | null;
  lastSettlementAt?: string | null;
  daysOutstanding: number;
  agingBucket: AgingBucket;
}

export interface ArSettlementResponse {
  settlementId: string;
  customerId: string;
  locationId: string;
  amount: number;
  currency: string;
  paymentMethodId: string;
  note?: string | null;
  journalEntryId?: string | null;
  outstandingBalanceAfter: number;
  settledAt: string;
}

export const AGING_BUCKET_LABELS: Record<AgingBucket, string> = {
  CURRENT: "Current",
  DAYS_30: "1–30 days",
  DAYS_60: "31–60 days",
  DAYS_90: "61–90 days",
  DAYS_90_PLUS: "90+ days",
};

export const AGING_BUCKET_TONES: Record<AgingBucket, string> = {
  CURRENT: "bg-green-50 text-green-700",
  DAYS_30: "bg-blue-50 text-blue-700",
  DAYS_60: "bg-amber-50 text-amber-700",
  DAYS_90: "bg-orange-50 text-orange-700",
  DAYS_90_PLUS: "bg-red-50 text-red-700",
};
