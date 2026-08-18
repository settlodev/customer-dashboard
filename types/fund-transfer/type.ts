export interface FundTransfer {
  id: string;
  slug: string;
  locationId: string;
  businessId: string;
  fromAccountId: string;
  fromAccountCode?: string | null;
  fromAccountName?: string | null;
  toAccountId: string;
  toAccountCode?: string | null;
  toAccountName?: string | null;
  amount: number;
  feeAmount?: number | null;
  taxAmount?: number | null;
  netAmount?: number | null;
  currencyCode: string;
  transferDate: string;
  description?: string | null;
  reference?: string | null;
  notes?: string | null;
  transferredBy?: string | null;
  journalEntryId?: string | null;
  createdAt: string;
  updatedAt: string;
}
