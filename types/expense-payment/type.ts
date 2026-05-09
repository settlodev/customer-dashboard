export interface ExpensePayment {
  id: string;
  slug: string;
  expenseId: string;
  amount: number;
  currencyCode: string;
  exchangeRate?: number | null;
  paymentDate: string;
  paymentMethod?: string | null;
  paymentMethodId: string;
  paymentMethodCode?: string | null;
  sourceAccountId: string;
  sourceAccountCode?: string | null;
  sourceAccountName?: string | null;
  reference?: string | null;
  notes?: string | null;
  receiptUrl?: string | null;
  locationId: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}
