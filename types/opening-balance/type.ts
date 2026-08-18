export interface OpeningBalanceLineView {
  chartOfAccountId: string;
  debit: number;
  credit: number;
}

export interface OpeningBalanceStatus {
  posted: boolean;
  entryId?: string | null;
  entryNumber?: string | null;
  asOfDate?: string | null;
  suggestedAsOfDate?: string | null;
  lines: OpeningBalanceLineView[];
}

// POST response echo — used only for the success toast / refresh.
export interface OpeningBalanceResponse {
  journalEntryId: string;
  entryNumber: string;
  asOfDate: string;
  currencyCode: string;
  totalDebit: number;
  totalCredit: number;
  postedAt: string;
  lines: OpeningBalanceLineView[];
}
