export type JournalEntryStatus = "DRAFT" | "POSTED" | "VOIDED";

export type JournalEntryType =
  | "MANUAL"
  | "EXPENSE"
  | "PAYMENT"
  | "ADJUSTMENT"
  | "ORDER"
  | "REFUND";

export interface JournalEntryLine {
  id?: string;
  chartOfAccountId: string;
  description?: string | null;
  debitAmount: number;
  creditAmount: number;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  description?: string | null;
  reference?: string | null;
  entryDate: string;
  entryType: JournalEntryType;
  status: JournalEntryStatus;
  currencyCode: string;
  exchangeRate?: number | null;
  totalDebit: number;
  totalCredit: number;
  balanced: boolean;
  sourceType?: string | null;
  sourceId?: string | null;
  postedBy?: string | null;
  postedAt?: string | null;
  lines: JournalEntryLine[];
  locationId: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export const JOURNAL_ENTRY_STATUS_LABELS: Record<JournalEntryStatus, string> = {
  DRAFT: "Draft",
  POSTED: "Posted",
  VOIDED: "Voided",
};

export const JOURNAL_ENTRY_STATUS_TONES: Record<JournalEntryStatus, string> = {
  DRAFT: "bg-amber-50 text-amber-700",
  POSTED: "bg-green-50 text-green-700",
  VOIDED: "bg-gray-100 text-gray-500",
};
