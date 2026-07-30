// ── Chart of account (shared) ──────────────────────────────────────

export type AccountType =
  | "CURRENT_ASSET"
  | "NON_CURRENT_ASSET"
  | "CURRENT_LIABILITY"
  | "NON_CURRENT_LIABILITY"
  | "EQUITY"
  | "REVENUE"
  | "EXPENSE";

export type NormalBalance = "DEBIT" | "CREDIT";

export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  description: string | null;
  accountType: AccountType;
  accountSubType: string | null;
  normalBalance: NormalBalance;
  parentId: string | null;
  plSection: PlSection | null;
  systemAccount: boolean;
  active: boolean;
  locationId: string | null;
  businessId: string | null;
  createdAt: string;
  updatedAt: string;
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CURRENT_ASSET: "Current Asset",
  NON_CURRENT_ASSET: "Non-Current Asset",
  CURRENT_LIABILITY: "Current Liability",
  NON_CURRENT_LIABILITY: "Non-Current Liability",
  EQUITY: "Equity",
  REVENUE: "Revenue",
  EXPENSE: "Expense",
};

export type PlSection =
  | "REVENUE"
  | "COST_OF_SALES"
  | "OPERATING_EXPENSE"
  | "OTHER_INCOME_AND_EXPENSE"
  | "TAX_EXPENSE";

export const PL_SECTION_LABELS: Record<PlSection, string> = {
  REVENUE: "Revenue / Sales",
  COST_OF_SALES: "Cost of Sales",
  OPERATING_EXPENSE: "Operating Expenses",
  OTHER_INCOME_AND_EXPENSE: "Other Income & Expenses",
  TAX_EXPENSE: "Tax Expense",
};

/**
 * Which sections each account type may use. Mirrors PlSection.validFor on the
 * backend — an empty array means the account takes no section at all.
 */
export const PL_SECTIONS_BY_ACCOUNT_TYPE: Record<AccountType, PlSection[]> = {
  REVENUE: ["REVENUE", "OTHER_INCOME_AND_EXPENSE"],
  EXPENSE: [
    "COST_OF_SALES",
    "OPERATING_EXPENSE",
    "OTHER_INCOME_AND_EXPENSE",
    "TAX_EXPENSE",
  ],
  CURRENT_ASSET: [],
  NON_CURRENT_ASSET: [],
  CURRENT_LIABILITY: [],
  NON_CURRENT_LIABILITY: [],
  EQUITY: [],
};

/**
 * The P&L section a new account of this type should be pre-filled with.
 * Mirrors the backend's own default (see the V44 migration's backfill,
 * which puts every untagged merchant-custom expense account in
 * OPERATING_EXPENSE, never COST_OF_SALES): expenses default to Operating
 * Expenses, not the first entry in PL_SECTIONS_BY_ACCOUNT_TYPE, which is
 * Cost of Sales and would silently understate Gross Profit if left as the
 * default. A `Record` over AccountType makes a missed type a compile error
 * rather than a silently-wrong fallback.
 */
export const DEFAULT_PL_SECTION_BY_ACCOUNT_TYPE: Record<AccountType, PlSection | null> = {
  REVENUE: "REVENUE",
  EXPENSE: "OPERATING_EXPENSE",
  CURRENT_ASSET: null,
  NON_CURRENT_ASSET: null,
  CURRENT_LIABILITY: null,
  NON_CURRENT_LIABILITY: null,
  EQUITY: null,
};

/** Both asset classes — for pickers that used to pass accountType="ASSET". */
export const ASSET_TYPES: AccountType[] = ["CURRENT_ASSET", "NON_CURRENT_ASSET"];

/** Both liability classes. */
export const LIABILITY_TYPES: AccountType[] = [
  "CURRENT_LIABILITY",
  "NON_CURRENT_LIABILITY",
];

/** Everything that appears on the balance sheet rather than the P&L. */
export const BALANCE_SHEET_ACCOUNT_TYPES: AccountType[] = [
  ...ASSET_TYPES,
  ...LIABILITY_TYPES,
  "EQUITY",
];

// ── Payment method → account mapping ───────────────────────────────

export type SettlementTreatment = "IMMEDIATE" | "RECEIVABLE";

export interface PaymentMethodAccountMapping {
  id: string;
  locationId: string;
  businessId: string | null;
  paymentMethodId: string;
  paymentMethodCode: string;
  chartOfAccountId: string;
  chartOfAccountCode: string | null;
  chartOfAccountName: string | null;
  settlementTreatment: SettlementTreatment;
  active: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethodMappingPayload {
  locationId: string;
  paymentMethodId: string;
  paymentMethodCode: string;
  chartOfAccountId: string;
  settlementTreatment?: SettlementTreatment;
  notes?: string;
  active?: boolean;
}

// ── Product revenue → account mapping ──────────────────────────────

export interface ProductRevenueMapping {
  id: string;
  locationId: string;
  businessId: string | null;
  productId: string;
  productName: string | null;
  chartOfAccountId: string;
  chartOfAccountCode: string | null;
  chartOfAccountName: string | null;
  active: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductRevenueMappingPayload {
  locationId: string;
  productId: string;
  productName?: string;
  chartOfAccountId: string;
  notes?: string;
  active?: boolean;
}
