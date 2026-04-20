"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { FormResponse } from "@/types/types";
import type {
  ChartOfAccount,
  PaymentMethodAccountMapping,
  PaymentMethodMappingPayload,
  ProductRevenueMapping,
  ProductRevenueMappingPayload,
  AccountType,
} from "@/types/accounting-mapping/type";
import { accountingUrl } from "./accounting-client";

// ── Chart of accounts ──────────────────────────────────────────────

export async function listChartOfAccounts(
  accountType?: AccountType,
): Promise<ChartOfAccount[]> {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams();
    if (accountType) params.set("accountType", accountType);
    const url = params.toString()
      ? accountingUrl(`/api/v1/chart-of-accounts/all?${params.toString()}`)
      : accountingUrl("/api/v1/chart-of-accounts/all");
    const data = await apiClient.get(url);
    return parseStringify(data) ?? [];
  } catch {
    return [];
  }
}

// ── Payment method → account mappings ──────────────────────────────

export async function listPaymentMethodMappings(
  locationId: string,
): Promise<PaymentMethodAccountMapping[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/payment-method-mappings/location/${locationId}`),
    );
    return parseStringify(data) ?? [];
  } catch {
    return [];
  }
}

export async function upsertPaymentMethodMapping(
  input: PaymentMethodMappingPayload,
): Promise<FormResponse<PaymentMethodAccountMapping>> {
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.put(
      accountingUrl("/api/v1/payment-method-mappings"),
      input,
    )) as PaymentMethodAccountMapping;
    revalidatePath("/settings");
    return {
      responseType: "success",
      message: "Payment method mapping saved",
      data: parseStringify(data),
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to save mapping",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function deletePaymentMethodMapping(
  id: string,
): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(
      accountingUrl(`/api/v1/payment-method-mappings/${id}`),
    );
    revalidatePath("/settings");
    return {
      responseType: "success",
      message: "Mapping deactivated — payments fall back to suspense until a new mapping is created.",
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to deactivate mapping",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

// ── Product revenue → account mappings ─────────────────────────────

export async function listProductRevenueMappings(
  locationId: string,
): Promise<ProductRevenueMapping[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/product-revenue-mappings/location/${locationId}`),
    );
    return parseStringify(data) ?? [];
  } catch {
    return [];
  }
}

export async function upsertProductRevenueMapping(
  input: ProductRevenueMappingPayload,
): Promise<FormResponse<ProductRevenueMapping>> {
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.put(
      accountingUrl("/api/v1/product-revenue-mappings"),
      input,
    )) as ProductRevenueMapping;
    revalidatePath("/settings");
    return {
      responseType: "success",
      message: "Product revenue mapping saved",
      data: parseStringify(data),
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to save mapping",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function deleteProductRevenueMapping(
  id: string,
): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(
      accountingUrl(`/api/v1/product-revenue-mappings/${id}`),
    );
    revalidatePath("/settings");
    return {
      responseType: "success",
      message: "Mapping deactivated — revenue returns to default Sales account.",
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to deactivate mapping",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
