export interface ProviderSettlementBalance {
  paymentMethodId: string;
  paymentMethodCode: string;
  locationId: string;
  currency: string;
  totalCharged: number;
  totalSettled: number;
  outstandingBalance: number;
  outstandingChargeCount: number;
  oldestUnsettledAt: string | null;
  lastChargeAt: string | null;
  lastSettlementAt: string | null;
}

export interface ProviderSettlementResponse {
  settlementId: string;
  paymentMethodId: string;
  locationId: string;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  currency: string;
  journalEntryId: string;
  outstandingBalanceAfter: number;
  settledAt: string;
  note: string | null;
}
