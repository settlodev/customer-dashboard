"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { rethrowIfBoundary } from "@/lib/list-fallback";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { ApiResponse, FormResponse } from "@/types/types";
import type {
  ProviderSettlementBalance,
  ProviderSettlementResponse,
} from "@/types/provider-settlement/type";
import { ProviderSettlementSchema } from "@/types/provider-settlement/schema";

import { accountingUrl } from "./accounting-client";

export async function listProviderSettlementBalances(
  locationId: string,
  page = 0,
  size = 20,
): Promise<ApiResponse<ProviderSettlementBalance>> {
  try {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", String(size));
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(
        `/api/v1/locations/${locationId}/provider-settlement-balances?${params.toString()}`,
      ),
    );
    return parseStringify(data);
  } catch (error) {
    rethrowIfBoundary(error);
    console.error("listProviderSettlementBalances failed", error);
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      pageable: { pageNumber: page, pageSize: size },
      last: true,
    } as unknown as ApiResponse<ProviderSettlementBalance>;
  }
}

// The payout form always carries the active location alongside the fields the
// schema validates — kept out of ProviderSettlementSchema itself (mirroring
// how createFundTransfer takes `locationId` separately from its schema) so
// the schema stays focused on the user-editable payout fields.
type CreateProviderSettlementValues = z.infer<typeof ProviderSettlementSchema> & {
  locationId: string;
};

export async function createProviderSettlement(
  paymentMethodId: string,
  values: CreateProviderSettlementValues,
): Promise<FormResponse<ProviderSettlementResponse>> {
  const parsed = ProviderSettlementSchema.safeParse(values);
  if (!parsed.success) {
    return {
      responseType: "error",
      message: "Please correct the errors and try again",
      error: new Error(parsed.error.message),
    };
  }
  try {
    const apiClient = new ApiClient();
    const payload = {
      ...parsed.data,
      locationId: values.locationId,
      bankAccountId: parsed.data.bankAccountId || undefined,
      note: parsed.data.note || undefined,
    };
    const data = (await apiClient.post(
      accountingUrl(
        `/api/v1/payment-methods/${paymentMethodId}/provider-settlements`,
      ),
      payload,
    )) as ProviderSettlementResponse;
    revalidatePath("/accounting/provider-settlements");
    return {
      responseType: "success",
      message: "Provider settlement recorded",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    console.error("createProviderSettlement failed", error);
    return {
      responseType: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to record provider settlement",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
