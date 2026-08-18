"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { ApiResponse, FormResponse } from "@/types/types";
import type {
  ArSettlementResponse,
  CustomerArBalance,
} from "@/types/customer-ar/type";

import { accountingUrl } from "./accounting-client";
import { rethrowIfBoundary } from "@/lib/list-fallback";

export async function listArBalances(
  locationId: string,
  minOutstanding = 0,
  page = 0,
  size = 20,
): Promise<ApiResponse<CustomerArBalance>> {
  try {
    const params = new URLSearchParams();
    params.set("minOutstanding", String(minOutstanding));
    params.set("page", String(page));
    params.set("size", String(size));
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(
        `/api/v1/locations/${locationId}/ar-balances?${params.toString()}`,
      ),
    );
    return parseStringify(data);
  } catch (error) {
    rethrowIfBoundary(error);
    console.error("listArBalances failed", error);
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      pageable: { pageNumber: page, pageSize: size },
      last: true,
    } as unknown as ApiResponse<CustomerArBalance>;
  }
}

export async function getCustomerArBalance(
  customerId: string,
  locationId: string,
): Promise<CustomerArBalance | null> {
  try {
    const params = new URLSearchParams({ locationId });
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(
        `/api/v1/customers/${customerId}/ar-balance?${params.toString()}`,
      ),
    );
    return parseStringify(data);
  } catch {
    return null;
  }
}

interface SettlementInput {
  customerId: string;
  locationId: string;
  amount: number;
  paymentMethodId: string;
  note?: string;
}

export async function recordArSettlement(
  input: SettlementInput,
): Promise<FormResponse<ArSettlementResponse>> {
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      accountingUrl(`/api/v1/customers/${input.customerId}/ar-settlements`),
      {
        locationId: input.locationId,
        amount: input.amount,
        paymentMethodId: input.paymentMethodId,
        note: input.note || undefined,
      },
    )) as ArSettlementResponse;
    revalidatePath("/debtors");
    return {
      responseType: "success",
      message: "Settlement recorded",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    console.error("recordArSettlement failed", error);
    return {
      responseType: "error",
      message:
        error instanceof Error ? error.message : "Failed to record settlement",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
