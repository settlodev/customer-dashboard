"use server";

import { getGrn } from "@/lib/actions/grn-actions";
import { getLpo } from "@/lib/actions/lpo-actions";
import { getExpenseByReference } from "@/lib/actions/expense-actions";
import { listExpenseCreditNotes } from "@/lib/actions/expense-credit-note-actions";
import { findOwedRefundByReturn } from "@/lib/actions/supplier-refund-actions";
import type { Expense } from "@/types/expense/type";
import type { ExpenseCreditNote } from "@/types/expense-credit-note/type";
import type { SupplierRefund } from "@/types/supplier-refund/type";

export interface ReturnReconciliation {
  bill: Expense;
  creditNote: ExpenseCreditNote | null;
  owedRefund: SupplierRefund | null;
}

/**
 * Resolve the bill + the auto-raised credit note for a supplier return:
 * return → grnId → GRN.lpoId → LPO.lpoNumber → bill (reference==lpoNumber)
 * → its credit notes → the one whose reference matches this returnNumber.
 * Returns null when the return isn't correlated to a bill (no GRN / LPO / bill).
 */
export async function resolveReturnReconciliation(
  grnId: string,
  returnNumber: string,
): Promise<ReturnReconciliation | null> {
  try {
    const grn = await getGrn(grnId);
    if (!grn?.lpoId) return null;

    const lpo = await getLpo(grn.lpoId);
    if (!lpo) return null;

    const bill = await getExpenseByReference(lpo.lpoNumber);
    if (!bill) return null;

    const notes = await listExpenseCreditNotes(bill.id);
    const creditNote = notes.find((n) => n.reference === returnNumber) ?? null;
    const owedRefund = await findOwedRefundByReturn(returnNumber);
    return { bill, creditNote, owedRefund };
  } catch (error) {
    console.error("resolveReturnReconciliation failed", error);
    return null;
  }
}
