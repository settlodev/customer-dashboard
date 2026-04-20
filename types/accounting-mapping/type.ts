// ── Chart of account (shared) ──────────────────────────────────────

export type AccountType =
  | "ASSET"
  | "LIABILITY"
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
  ASSET: "Asset",
  LIABILITY: "Liability",
  EQUITY: "Equity",
  REVENUE: "Revenue",
  EXPENSE: "Expense",
};

// ── Payment method → account mapping ───────────────────────────────

export interface PaymentMethodAccountMapping {
  id: string;
  locationId: string;
  businessId: string | null;
  paymentMethodId: string;
  paymentMethodCode: string;
  chartOfAccountId: string;
  chartOfAccountCode: string | null;
  chartOfAccountName: string | null;
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
