"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { getAuthToken } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { CorrectValueSchema } from "@/types/stock-modification/schema";
import { inventoryUrl } from "./inventory-client";
import { getCurrentDestination } from "./context";

/**
 * Corrects the recorded cost of one batch. Posts a stock modification whose
 * single line moves no quantity (`quantityChange: 0`) — the backend re-costs
 * the batch, splits the value delta between stock still on hand and stock
 * already consumed, and emits the event accounting books the GL entry from.
 *
 * `error.message` on a thrown `SettloApiError` already carries the backend's
 * `SettloBusinessException` message (e.g. "Batch ... is recalled — its value
 * cannot be corrected") through `handleSettloApiError`, so surfacing it
 * directly matches how sibling actions (`createStockModification`,
 * `createStockTransfer`, `createStockIntakeRecord`) already report errors.
 */
export async function correctBatchValue(
  input: z.infer<typeof CorrectValueSchema>,
): Promise<FormResponse> {
  const validated = CorrectValueSchema.safeParse(input);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: validated.error.issues[0]?.message ?? "Please fill all required fields",
      error: new Error(validated.error.message),
    });
  }

  const token = await getAuthToken();
  if (!token?.userId) {
    return parseStringify({
      responseType: "error",
      message: "Your session has expired. Please log in again.",
      error: new Error("Missing userId in auth token"),
    });
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl("/api/v1/stock-modifications"), {
      locationType: (await getCurrentDestination())?.type ?? "LOCATION",
      category: "CORRECTION",
      reason: validated.data.reason,
      performedBy: token.userId,
      modificationDate: new Date().toISOString(),
      notes: validated.data.notes,
      sourceReferenceType: validated.data.sourceReferenceType,
      sourceReferenceId: validated.data.sourceReferenceId,
      items: [
        {
          stockVariantId: validated.data.stockVariantId,
          batchId: validated.data.batchId,
          quantityChange: 0,
          unitCost: validated.data.newUnitCost,
          currency: validated.data.currency,
          notes: validated.data.notes,
        },
      ],
    });

    revalidatePath("/stock-modifications");
    revalidatePath("/stock-intakes");
    revalidatePath("/stock-batches");
    // Concrete-id revalidation — list-level revalidatePath doesn't refresh a
    // nested dynamic detail route (matches the confirm/cancel convention in
    // stock-intake-record-actions.ts).
    if (validated.data.sourceReferenceId) {
      revalidatePath(`/stock-intakes/${validated.data.sourceReferenceId}`);
    }
    revalidatePath(`/stock-batches/${validated.data.batchId}`);

    return parseStringify({
      responseType: "success",
      message: "Value corrected",
    });
  } catch (error) {
    return parseStringify({
      responseType: "error",
      message: error instanceof Error ? error.message : "Could not correct the value",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
