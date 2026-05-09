"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { FormResponse } from "@/types/types";
import type { AccountingPeriod } from "@/types/accounting-period/type";

import { accountingUrl } from "./accounting-client";

export async function listAccountingPeriods(): Promise<AccountingPeriod[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/accounting-periods`),
    );
    return (parseStringify(data) as AccountingPeriod[]) ?? [];
  } catch {
    return [];
  }
}

interface CloseInput {
  businessId: string;
  locationId: string;
  year: number;
  month: number;
  closedBy: string;
  notes?: string;
}

export async function closeAccountingPeriod(
  input: CloseInput,
): Promise<FormResponse<AccountingPeriod>> {
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      accountingUrl(`/api/v1/accounting-periods/close`),
      input,
    )) as AccountingPeriod;
    revalidatePath("/settings");
    return {
      responseType: "success",
      message: `${input.year}-${String(input.month).padStart(2, "0")} closed`,
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    console.error("closeAccountingPeriod failed", error);
    return {
      responseType: "error",
      message:
        error instanceof Error ? error.message : "Failed to close period",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

interface ReopenInput {
  locationId: string;
  year: number;
  month: number;
  reopenedBy: string;
  reason: string;
}

export async function reopenAccountingPeriod(
  input: ReopenInput,
): Promise<FormResponse<AccountingPeriod>> {
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      accountingUrl(`/api/v1/accounting-periods/reopen`),
      input,
    )) as AccountingPeriod;
    revalidatePath("/settings");
    return {
      responseType: "success",
      message: `${input.year}-${String(input.month).padStart(2, "0")} reopened`,
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    console.error("reopenAccountingPeriod failed", error);
    return {
      responseType: "error",
      message:
        error instanceof Error ? error.message : "Failed to reopen period",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
