"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { FormResponse } from "@/types/types";
import type { PaymentMethodReconciliation } from "@/types/payment-method-reconciliation/type";

import { accountingUrl } from "./accounting-client";

/** Per-method cash-up rows for a day session (Accounting Service). */
export async function listPaymentMethodReconciliations(
  sessionId: string,
): Promise<PaymentMethodReconciliation[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(
        `/api/v1/payment-method-reconciliations/by-session/${sessionId}`,
      ),
    );
    return (parseStringify(data) as PaymentMethodReconciliation[]) ?? [];
  } catch {
    return [];
  }
}

/**
 * Manager approval. Server-side this posts the Mobile Money Over/Short
 * journal for a manual-confirm non-cash method with a non-zero variance;
 * cash and provider-confirmed methods approve without a ledger entry.
 */
export async function approvePaymentMethodReconciliation(
  id: string,
  sessionId: string,
): Promise<FormResponse<PaymentMethodReconciliation>> {
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      accountingUrl(`/api/v1/payment-method-reconciliations/${id}/approve`),
      {},
    )) as PaymentMethodReconciliation;
    revalidatePath(`/day-sessions/${sessionId}`);
    return {
      responseType: "success",
      message: "Reconciliation approved",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    console.error("approvePaymentMethodReconciliation failed", error);
    return {
      responseType: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to approve reconciliation",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
