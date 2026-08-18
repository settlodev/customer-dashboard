export interface AdminBusinessInventorySummary {
  businessId: string;
  totalStockValue: number;
  totalQuantityOnHand: number;
  activeBatchCount: number;
  activeLocationCount: number;
  recalledBatchCount: number;
  lastReceivedDate: string | null;
  oldestActiveReceivedDate: string | null;
}

export interface AdminBusinessFinancialsSummary {
  businessId: string;
  periodStart: string;
  periodEnd: string;

  revenuePeriod: number;
  expensesPaidPeriod: number;
  expensesTotalPeriod: number;
  netCashFlowPeriod: number;

  apOutstanding: number;
  apCurrent: number;
  apDays30: number;
  apDays60: number;
  apDays90: number;
  apDays90Plus: number;

  lastJournalEntryAt: string | null;
  lastExpenseAt: string | null;

  postedJournalEntriesPeriod: number;
  postedExpensesPeriod: number;
}
