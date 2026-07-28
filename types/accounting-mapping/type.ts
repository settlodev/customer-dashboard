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
