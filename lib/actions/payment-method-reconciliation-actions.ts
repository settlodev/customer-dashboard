"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { FormResponse } from "@/types/types";
import type {
  PaymentMethodReconciliation,
  SessionCashUp,
} from "@/types/payment-method-reconciliation/type";

import { accountingUrl } from "./accounting-client";

/**
 * The session's cash-up: every per-method row plus the totals —
 * collected / expenses / expected / counted / variance — struck by
 * Accounting. Each row's expense-netted `expectedNet` and the totals come
 * from the same service that posts the over/short journal, so no surface
 * that renders them can disagree with the ledger.
 *
 * Falls back to an empty cash-up (never throws) — the page still renders
 * the rest of the Close-of-Day sections when Accounting is unavailable.
 */
export async function getSessionCashUp(
  sessionId: string,
): Promise<SessionCashUp> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(
        `/api/v1/payment-method-reconciliations/by-session/${sessionId}/cash-up`,
      ),
    );
    const cashUp = parseStringify(data) as SessionCashUp | null;
    return cashUp?.totals ? cashUp : emptyCashUp(sessionId);
  } catch {
    return emptyCashUp(sessionId);
  }
}

const emptyCashUp = (sessionId: string): SessionCashUp => ({
  daySessionId: sessionId,
  currency: null,
  methods: [],
  totals: {
    methodCount: 0,
    pendingCount: 0,
    approvedCount: 0,
    collected: 0,
    expensePaid: 0,
    expected: 0,
    counted: 0,
    variance: 0,
    hasExpenses: false,
  },
});

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
