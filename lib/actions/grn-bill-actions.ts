"use server";

import { getLpo } from "@/lib/actions/lpo-actions";
import { getExpenseByReference } from "@/lib/actions/expense-actions";
import type { Expense } from "@/types/expense/type";

export interface GrnBillResolution {
  /** The supplier bill (Expense) created from the LPO at acceptance. */
  expense: Expense;
  /** True when the LPO is fully received (LpoStatus === "RECEIVED"). */
  lpoFullyReceived: boolean;
}

/**
 * Resolve the supplier bill for a GRN's LPO. The GRN carries only `lpoId`, but
 * the bill is keyed by the human-readable `lpoNumber` (expense.reference), so we
 * fetch the LPO to translate lpoId → lpoNumber, then look the bill up by
 * reference. Returns null if there is no LPO or no matching bill (ad-hoc GRN, or
 * the bill has not been created yet).
 */
export async function resolveBillForLpo(
  lpoId: string,
): Promise<GrnBillResolution | null> {
  const lpo = await getLpo(lpoId);
  if (!lpo) return null;

  const expense = await getExpenseByReference(lpo.lpoNumber);
  if (!expense) return null;

  return { expense, lpoFullyReceived: lpo.status === "RECEIVED" };
}
