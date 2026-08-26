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

/**
 * Financials for a business, or for one of its locations when `locationId` is
 * set. Both cuts come from the same arithmetic with one predicate switched — a
 * business is the sum of its locations, and the location is what actually
 * trades.
 *
 * Note `apOutstanding` and its aging buckets are as-of-today, not
 * period-bounded, at either grain: an unsettled bill is outstanding now, not
 * "outstanding during the window".
 */
export interface AdminBusinessFinancialsSummary {
  businessId: string;
  /** Null for the business-wide rollup; echoed back so a caller can tell which cut it holds. */
  locationId: string | null;
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
  /**
   * Count of APPROVED expenses in the period. Named for what Accounting
   * actually sends — expenses move DRAFT → PENDING → APPROVED, and "POSTED" is
   * the journal-entry vocabulary. This was previously declared as
   * `postedExpensesPeriod`, which matches no field on the wire, so every
   * consumer silently rendered 0.
   */
  approvedExpensesPeriod: number;
}
