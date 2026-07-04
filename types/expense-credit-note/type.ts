export type CreditNoteReason =
  | "RETURN"
  | "SHORT_DELIVERY"
  | "PRICE_CORRECTION"
  | "DAMAGE"
  | "DISCOUNT"
  | "OTHER";

export const CREDIT_NOTE_REASON_LABELS: Record<CreditNoteReason, string> = {
  RETURN: "Return",
  SHORT_DELIVERY: "Short delivery",
  PRICE_CORRECTION: "Price correction",
  DAMAGE: "Damage",
  DISCOUNT: "Discount",
  OTHER: "Other",
};

export interface ExpenseCreditNote {
  id: string;
  slug: string;
  creditNoteNumber: string;
  expenseId: string;
  amount: number;
  offsetChartOfAccountId: string;
  offsetAccountCode?: string | null;
  offsetAccountName?: string | null;
  reason: CreditNoteReason;
  reference?: string | null;
  notes?: string | null;
  creditNoteDate: string;
  createdBy?: string | null;
  locationId: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}
