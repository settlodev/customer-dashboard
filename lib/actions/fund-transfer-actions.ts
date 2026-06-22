"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { rethrowIfBoundary } from "@/lib/list-fallback";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { ApiResponse, FormResponse } from "@/types/types";
import type { FundTransfer } from "@/types/fund-transfer/type";
import { FundTransferSchema } from "@/types/fund-transfer/schema";

import { accountingUrl } from "./accounting-client";

export async function listFundTransfers(
  locationId: string,
  page = 0,
  size = 20,
): Promise<ApiResponse<FundTransfer>> {
  try {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", String(size));
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(
        `/api/v1/fund-transfers/location/${locationId}?${params.toString()}`,
      ),
    );
    return parseStringify(data);
  } catch (error) {
    rethrowIfBoundary(error);
    console.error("listFundTransfers failed", error);
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      pageable: { pageNumber: page, pageSize: size },
      last: true,
    } as unknown as ApiResponse<FundTransfer>;
  }
}

export async function getFundTransfer(id: string): Promise<FundTransfer | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/fund-transfers/${id}`),
    );
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function createFundTransfer(
  locationId: string,
  values: z.infer<typeof FundTransferSchema>,
): Promise<FormResponse<FundTransfer>> {
  const parsed = FundTransferSchema.safeParse(values);
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
      locationId,
      description: parsed.data.description || undefined,
      reference: parsed.data.reference || undefined,
      notes: parsed.data.notes || undefined,
    };
    const data = (await apiClient.post(
      accountingUrl("/api/v1/fund-transfers"),
      payload,
    )) as FundTransfer;
    revalidatePath("/accounting/fund-transfers");
    return {
      responseType: "success",
      message: "Fund transfer recorded",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    console.error("createFundTransfer failed", error);
    return {
      responseType: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to record fund transfer",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
