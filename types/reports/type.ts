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
  netIncome: number;
  generatedAt: string;
}

export interface BalanceSheetReport {
  locationId: string;
  businessId: string;
  asOfDate: string;
  currencyCode: string;
  assets: AccountBalanceRow[];
  liabilities: AccountBalanceRow[];
  equity: AccountBalanceRow[];
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
