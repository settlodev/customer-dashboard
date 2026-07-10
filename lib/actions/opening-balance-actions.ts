"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { FormResponse } from "@/types/types";
import {
  OpeningBalanceSchema,
  type OpeningBalanceFormValues,
} from "@/types/opening-balance/schema";
import type {
  OpeningBalanceResponse,
  OpeningBalanceStatus,
} from "@/types/opening-balance/type";

import { accountingUrl } from "./accounting-client";

export async function getOpeningBalanceStatus(): Promise<OpeningBalanceStatus> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl("/api/v1/opening-balances/status"),
    );
    return parseStringify(data);
  } catch (error) {
    // Read-path resilience: a failed status load renders the "not recorded"
    // state instead of crashing the settings page. User actions (post/void)
    // surface their own errors via FormResponse/toast.
    console.error("getOpeningBalanceStatus failed", error);
    return { posted: false, lines: [] };
  }
}

export async function postOpeningBalance(
  values: OpeningBalanceFormValues,
): Promise<FormResponse<OpeningBalanceResponse>> {
  const parsed = OpeningBalanceSchema.safeParse(values);
  if (!parsed.success) {
    return {
      responseType: "error",
      message: "Please correct the errors and try again",
      error: new Error(parsed.error.message),
    };
  }
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      accountingUrl("/api/v1/opening-balances"),
      {
        asOfDate: parsed.data.asOfDate || undefined,
        lines: parsed.data.lines,
      },
    )) as OpeningBalanceResponse;
    revalidatePath("/settings");
    return {
      responseType: "success",
      message: "Opening balances recorded",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    console.error("postOpeningBalance failed", error);
    return {
      responseType: "error",
      message:
        error instanceof Error ? error.message : "Failed to record opening balances",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
