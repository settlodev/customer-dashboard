"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { FormResponse } from "@/types/types";
import type {
  AccountType,
  ChartOfAccount,
} from "@/types/accounting-mapping/type";
import {
  ChartOfAccountSchema,
  type ChartOfAccountFormValues,
} from "@/types/chart-of-account/schema";

import { accountingUrl } from "./accounting-client";

interface ListOpts {
  accountType?: AccountType;
  page?: number;
  size?: number;
}

export async function listChartOfAccountsPaged(opts: ListOpts = {}) {
  try {
    const params = new URLSearchParams();
    if (opts.accountType) params.set("accountType", opts.accountType);
    params.set("page", String(opts.page ?? 0));
    params.set("size", String(opts.size ?? 50));
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/chart-of-accounts?${params.toString()}`),
    );
    return parseStringify(data);
  } catch (error) {
    console.error("listChartOfAccountsPaged failed", error);
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      pageable: { pageNumber: 0, pageSize: opts.size ?? 50 },
      last: true,
    };
  }
}

export async function getChartOfAccount(
  id: string,
): Promise<ChartOfAccount | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/chart-of-accounts/${id}`),
    );
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function createChartOfAccount(
  values: ChartOfAccountFormValues,
): Promise<FormResponse<ChartOfAccount>> {
  const parsed = ChartOfAccountSchema.safeParse(values);
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
      accountingUrl("/api/v1/chart-of-accounts"),
      sanitize(parsed.data),
    )) as ChartOfAccount;
    revalidatePath("/settings");
    return {
      responseType: "success",
      message: "Account created",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    return errResp(error, "Failed to create account");
  }
}

export async function updateChartOfAccount(
  id: string,
  values: ChartOfAccountFormValues,
): Promise<FormResponse<ChartOfAccount>> {
  const parsed = ChartOfAccountSchema.safeParse(values);
  if (!parsed.success) {
    return {
      responseType: "error",
      message: "Please correct the errors and try again",
      error: new Error(parsed.error.message),
    };
  }
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.put(
      accountingUrl(`/api/v1/chart-of-accounts/${id}`),
      sanitize(parsed.data),
    )) as ChartOfAccount;
    revalidatePath("/settings");
    return {
      responseType: "success",
      message: "Account updated",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    return errResp(error, "Failed to update account");
  }
}

export async function deleteChartOfAccount(id: string): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(accountingUrl(`/api/v1/chart-of-accounts/${id}`));
    revalidatePath("/settings");
    return { responseType: "success", message: "Account deleted" };
  } catch (error: unknown) {
    return errResp(error, "Failed to delete account");
  }
}

export async function toggleChartOfAccountActive(
  id: string,
): Promise<FormResponse<ChartOfAccount>> {
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.patch(
      accountingUrl(`/api/v1/chart-of-accounts/${id}/toggle-active`),
      {},
    )) as ChartOfAccount;
    revalidatePath("/settings");
    return {
      responseType: "success",
      message: "Account status updated",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    return errResp(error, "Failed to update account");
  }
}

function sanitize(values: ChartOfAccountFormValues) {
  return {
    ...values,
    description: values.description || undefined,
    accountSubType: values.accountSubType || undefined,
    parentId: values.parentId || undefined,
  };
}

function errResp(error: unknown, fallback: string): FormResponse<ChartOfAccount> {
  console.error(fallback, error);
  return {
    responseType: "error",
    message: error instanceof Error ? error.message : fallback,
    error: error instanceof Error ? error : new Error(String(error)),
  };
}
