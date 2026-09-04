import type { AccountType, NormalBalance } from "@/types/accounting-mapping/type";

export interface AccountBalanceRow {
  accountId: string | null;
  code: string;
  name: string;
  accountType: AccountType;
  normalBalance: NormalBalance;
  parentId?: string | null;
  debit: number;
  credit: number;
  balance: number;
}

export interface TrialBalanceReport {
  locationId: string;
  businessId: string;
  asOfDate: string;
  currencyCode: string;
  rows: AccountBalanceRow[];
  totalDebit: number;
  totalCredit: number;
  balanced: boolean;
  generatedAt: string;
}

export interface PlSectionLine {
  accountId: string | null;
  code: string;
  name: string;
  amount: number;
  children: PlSectionLine[];
  total: number;
}

export interface PlSectionGroup {
  lines: PlSectionLine[];
  total: number;
}

export interface PlSections {
  revenue: PlSectionGroup;
  costOfSales: PlSectionGroup;
  operatingExpenses: PlSectionGroup;
  otherIncomeAndExpenses: PlSectionGroup;
  taxExpense: PlSectionGroup;
}

export interface ProfitAndLossReport {
  locationId: string;
  businessId: string;
  startDate: string;
  endDate: string;
  currencyCode: string;
  revenue: AccountBalanceRow[];
  expenses: AccountBalanceRow[];
  totalRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  /**
   * The statement in IAS 1 section form. Namespaced deliberately: the legacy
   * `totalRevenue` is every revenue account, while `sections.revenue.total`
   * is only the Revenue section — two different numbers that flat sibling
   * names would invite confusing.
   */
  sections: PlSections;
  operatingProfit: number;
  netProfitBeforeTax: number;
  netProfitAfterTax: number;
  netIncome: number;
  generatedAt: string;
}

/** One column of the monthly statement — a calendar month. */
export interface PlPeriod {
  year: number;
  month: number;
  /** e.g. "Jan 2026" */
  label: string;
  startDate: string;
  endDate: string;
}

/**
 * One line of the monthly statement. Same vocabulary as `PlSectionLine`,
 * pluralised per period: `amounts[i]` is the account's own posting in
 * period i, `totals[i]` adds its children. `amount`/`total` span the range.
 */
export interface PlPeriodLine {
  accountId: string | null;
  code: string;
  name: string;
  amounts: number[];
  amount: number;
  children: PlPeriodLine[];
  totals: number[];
  total: number;
}

export interface PlPeriodGroup {
  lines: PlPeriodLine[];
  totals: number[];
  total: number;
}

export interface PlPeriodSections {
  revenue: PlPeriodGroup;
  costOfSales: PlPeriodGroup;
  operatingExpenses: PlPeriodGroup;
  otherIncomeAndExpenses: PlPeriodGroup;
  taxExpense: PlPeriodGroup;
}

export interface PlPeriodFigure {
  byPeriod: number[];
  total: number;
}

export interface MonthlyProfitAndLossReport {
  locationId: string;
  businessId: string;
  currencyCode: string;
  /** yyyy-MM */
  fromMonth: string;
  /** yyyy-MM */
  toMonth: string;
  periods: PlPeriod[];
  sections: PlPeriodSections;
  grossProfit: PlPeriodFigure;
  operatingProfit: PlPeriodFigure;
  netProfitBeforeTax: PlPeriodFigure;
  netProfitAfterTax: PlPeriodFigure;
  generatedAt: string;
}

/** One line of the nested balance-sheet view. `total` = own amount + children. */
export interface BalanceSheetLine {
  accountId: string | null;
  code: string;
  name: string;
  amount: number;
  children: BalanceSheetLine[];
  total: number;
}

/**
 * The same accounts as the flat lists, grouped by section with sub-lines
 * nested. A section is an account type, so nesting never crosses the
 * current / non-current boundary.
 */
export interface BalanceSheetSections {
  currentAssets: BalanceSheetLine[];
  nonCurrentAssets: BalanceSheetLine[];
  currentLiabilities: BalanceSheetLine[];
  nonCurrentLiabilities: BalanceSheetLine[];
  equity: BalanceSheetLine[];
}

export interface BalanceSheetReport {
  locationId: string;
  businessId: string;
  asOfDate: string;
  currencyCode: string;
  assets: AccountBalanceRow[];
  liabilities: AccountBalanceRow[];
  equity: AccountBalanceRow[];
  /**
   * Optional on purpose: an accounting service that predates the nested
   * view omits it, and the page falls back to rendering the flat lists.
   * Lets either side deploy first.
   */
  sections?: BalanceSheetSections;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  retainedEarnings: number;
  balanced: boolean;
  generatedAt: string;
}

export interface GeneralLedgerEntry {
  journalEntryId: string;
  entryNumber: string;
  entryDate: string;
  description?: string | null;
  reference?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface GeneralLedgerReport {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  normalBalance: NormalBalance;
  startDate: string;
  endDate: string;
  currencyCode: string;
  openingBalance: number;
  closingBalance: number;
  totalDebit: number;
  totalCredit: number;
  entries: GeneralLedgerEntry[];
  generatedAt: string;
}

export interface CategorySummary {
  categoryId: string | null;
  categoryName: string;
  expenseCount: number;
  amount: number;
  percentage: number;
}

export interface ExpenseSummaryReport {
  locationId: string;
  businessId: string;
  startDate: string;
  endDate: string;
  currencyCode: string;
  totalExpenseCount: number;
  totalExpenseAmount: number;
  totalPaidAmount: number;
  totalUnpaidAmount: number;
  categorySummaries: CategorySummary[];
  generatedAt: string;
}

export interface VendorAging {
  vendorId: string | null;
  vendorName: string;
  totalOutstanding: number;
  current: number;
  days30: number;
  days60: number;
  days90: number;
  days90Plus: number;
  openExpenseCount: number;
  oldestUnpaidDate?: string | null;
}

export interface ApAgingReport {
  locationId: string;
  businessId: string;
  asOfDate: string;
  currencyCode: string;
  totalOutstanding: number;
  current: number;
  days30: number;
  days60: number;
  days90: number;
  days90Plus: number;
  vendors: VendorAging[];
  generatedAt: string;
}
