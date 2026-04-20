"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import type { FormResponse } from "@/types/types";
import {
  SetManualRateSchema,
  type ManualExchangeRate,
  type SetManualRatePayload,
} from "@/types/exchange-rate/type";

/**
 * Manual exchange-rate CRUD hitting the Accounts Service. Uses the default
 * ApiClient base (ACCOUNTS_SERVICE_URL) and relies on the standard
 * X-Business-Id / X-Location-Id headers the dashboard injects on every call.
 */

export async function fetchManualExchangeRates(): Promise<ManualExchangeRate[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get("/api/v1/currencies/manual-rates");
    return (parseStringify(data) ?? []) as ManualExchangeRate[];
  } catch {
    return [];
  }
}

export async function setManualExchangeRate(
  payload: SetManualRatePayload,
): Promise<FormResponse<ManualExchangeRate>> {
  const validated = SetManualRateSchema.safeParse(payload);
  if (!validated.success) {
    return {
      responseType: "error",
      message: validated.error.issues[0]?.message ?? "Check the form",
      error: new Error(validated.error.message),
    };
  }
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.post(
      "/api/v1/currencies/manual-rates",
      validated.data,
    );
    revalidatePath("/settings");
    return {
      responseType: "success",
      message: "Manual rate saved",
      data: parseStringify(data) as ManualExchangeRate,
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Couldn't save rate",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function deleteManualExchangeRate(
  rateId: string,
): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(`/api/v1/currencies/manual-rates/${rateId}`);
    revalidatePath("/settings");
    return { responseType: "success", message: "Manual rate removed" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Couldn't delete rate",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
