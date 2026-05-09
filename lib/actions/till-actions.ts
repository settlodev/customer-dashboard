"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { ApiResponse, FormResponse } from "@/types/types";
import type {
  CashMovement,
  ExpectedCashBreakdown,
  TillReconciliation,
  VarianceReason,
} from "@/types/till/type";

import { accountingUrl } from "./accounting-client";

export async function listCashMovements(
  locationId: string,
  sessionId?: string,
): Promise<CashMovement[]> {
  try {
    const params = new URLSearchParams();
    if (sessionId) params.set("sessionId", sessionId);
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(
        `/api/v1/locations/${locationId}/cash-movements${
          params.toString() ? `?${params.toString()}` : ""
        }`,
      ),
    );
    return (parseStringify(data) as CashMovement[]) ?? [];
  } catch {
    return [];
  }
}

interface RecordCashMovementInput {
  movementType: "PAY_IN" | "PAY_OUT";
  amount: number;
  reference?: string;
  notes?: string;
  staffId?: string;
}

export async function recordCashMovement(
  locationId: string,
  input: RecordCashMovementInput,
): Promise<FormResponse<CashMovement>> {
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      accountingUrl(`/api/v1/locations/${locationId}/cash-movements`),
      {
        ...input,
        reference: input.reference || undefined,
        notes: input.notes || undefined,
        staffId: input.staffId || undefined,
      },
    )) as CashMovement;
    revalidatePath("/accounting/cash-movements");
    return {
      responseType: "success",
      message: "Cash movement recorded",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    console.error("recordCashMovement failed", error);
    return {
      responseType: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to record cash movement",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function getExpectedCashBreakdown(
  sessionId: string,
): Promise<ExpectedCashBreakdown | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/till-reconciliations/${sessionId}/expected`),
    );
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function listTillReconciliations(
  locationId: string,
  page = 0,
  size = 20,
): Promise<ApiResponse<TillReconciliation>> {
  try {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", String(size));
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(
        `/api/v1/locations/${locationId}/till-reconciliations?${params.toString()}`,
      ),
    );
    return parseStringify(data);
  } catch {
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      pageable: { pageNumber: page, pageSize: size },
      last: true,
    } as unknown as ApiResponse<TillReconciliation>;
  }
}

export async function getTillReconciliationBySession(
  sessionId: string,
): Promise<TillReconciliation | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/till-reconciliations/by-session/${sessionId}`),
    );
    return parseStringify(data);
  } catch {
    return null;
  }
}

interface SubmitReconciliationInput {
  sessionId: string;
  countedCash: number;
  denominations: Record<string, number>;
  varianceReason?: VarianceReason;
  notes?: string;
}

export async function submitTillReconciliation(
  locationId: string,
  input: SubmitReconciliationInput,
): Promise<FormResponse<TillReconciliation>> {
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      accountingUrl(`/api/v1/locations/${locationId}/till-reconciliations`),
      {
        ...input,
        notes: input.notes || undefined,
        varianceReason: input.varianceReason || undefined,
      },
    )) as TillReconciliation;
    revalidatePath("/accounting/till");
    return {
      responseType: "success",
      message: "Reconciliation submitted",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    console.error("submitTillReconciliation failed", error);
    return {
      responseType: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to submit reconciliation",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function approveTillReconciliation(
  id: string,
): Promise<FormResponse<TillReconciliation>> {
  return reviewWorkflow(id, "approve", "Reconciliation approved");
}

export async function rejectTillReconciliation(
  id: string,
): Promise<FormResponse<TillReconciliation>> {
  return reviewWorkflow(id, "reject", "Reconciliation rejected");
}

async function reviewWorkflow(
  id: string,
  action: "approve" | "reject",
  successMessage: string,
): Promise<FormResponse<TillReconciliation>> {
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      accountingUrl(`/api/v1/till-reconciliations/${id}/${action}`),
      {},
    )) as TillReconciliation;
    revalidatePath("/accounting/till");
    return {
      responseType: "success",
      message: successMessage,
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    console.error(`${action} reconciliation failed`, error);
    return {
      responseType: "error",
      message:
        error instanceof Error
          ? error.message
          : `Failed to ${action} reconciliation`,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
