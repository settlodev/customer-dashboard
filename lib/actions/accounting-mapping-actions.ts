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
    // The `/all` endpoint is unpaginated — the accountType filter is
    // applied client-side after the fetch. We still pass it through so
    // future server-side filtering Just Works without a callsite change.
    const url = params.toString()
      ? accountingUrl(`/api/v1/chart-of-accounts/all?${params.toString()}`)
      : accountingUrl("/api/v1/chart-of-accounts/all");
    const data = await apiClient.get(url);
    const rows = (parseStringify(data) ?? []) as ChartOfAccount[];
    if (accountType) {
      return rows.filter((r) => r.accountType === accountType);
    }
    return rows;
  } catch (error) {
    // Surface the real failure — silent fallback to [] hides
    // permission errors and 5xxs that left users staring at empty
    // dropdowns. Server-action logs end up in the next.js process
    // output, which is visible in the dashboard's runtime logs.
    console.error("listChartOfAccounts failed", error);
    return [];
  }
}

// ── Payment method → account mappings ──────────────────────────────

export type MappingListResult<T> = {
  data: T[];
  forbidden?: boolean;
  errorMessage?: string;
};

export async function listPaymentMethodMappings(
  locationId: string,
  activeOnly?: boolean,
): Promise<MappingListResult<PaymentMethodAccountMapping>> {
  try {
    const apiClient = new ApiClient();
    const url = activeOnly
      ? accountingUrl(
          `/api/v1/payment-method-mappings/location/${locationId}?activeOnly=true`,
        )
      : accountingUrl(
          `/api/v1/payment-method-mappings/location/${locationId}`,
        );
    const data = await apiClient.get(url);
    return { data: parseStringify(data) ?? [] };
  } catch (error: any) {
    if (error?.code === "FORBIDDEN" || error?.status === 403) {
      return {
        data: [],
        forbidden: true,
        errorMessage:
          error?.message ||
          "You do not have permission to view payment method mappings.",
      };
    }
    console.error("listPaymentMethodMappings failed", error);
    return { data: [], errorMessage: error?.message };
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
): Promise<MappingListResult<ProductRevenueMapping>> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/product-revenue-mappings/location/${locationId}`),
    );
    return { data: parseStringify(data) ?? [] };
  } catch (error: any) {
    if (error?.code === "FORBIDDEN" || error?.status === 403) {
      return {
        data: [],
        forbidden: true,
        errorMessage:
          error?.message ||
          "You do not have permission to view product revenue mappings.",
      };
    }
    console.error("listProductRevenueMappings failed", error);
    return { data: [], errorMessage: error?.message };
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
