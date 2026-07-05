"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { ApiResponse, FormResponse } from "@/types/types";
import type { SupplierRefund } from "@/types/supplier-refund/type";
import { SupplierRefundReceiveSchema } from "@/types/expense/schema";

import { accountingUrl } from "./accounting-client";

export async function listOwedRefunds(
  page: number,
  size: number,
): Promise<ApiResponse<SupplierRefund> | null> {
  try {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", String(size));
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/supplier-refunds/owed?${params.toString()}`),
    );
    return parseStringify(data) as ApiResponse<SupplierRefund>;
  } catch (error) {
    console.error("listOwedRefunds failed", error);
    return null;
  }
}

export async function receiveRefund(
  refundId: string,
  values: z.infer<typeof SupplierRefundReceiveSchema>,
): Promise<FormResponse<SupplierRefund>> {
  const parsed = SupplierRefundReceiveSchema.safeParse(values);
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
      reference: parsed.data.reference || undefined,
      notes: parsed.data.notes || undefined,
    };
    const data = (await apiClient.post(
      accountingUrl(`/api/v1/supplier-refunds/${refundId}/receive`),
      payload,
    )) as SupplierRefund;
    revalidatePath("/supplier-refunds");
    return {
      responseType: "success",
      message: "Refund recorded",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    console.error("receiveRefund failed", error);
    return {
      responseType: "error",
      message: error instanceof Error ? error.message : "Failed to record refund",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function findOwedRefundByReturn(
  returnNumber: string,
): Promise<SupplierRefund | null> {
  const page = await listOwedRefunds(0, 200);
  return page?.content?.find((r) => r.returnNumber === returnNumber) ?? null;
}

export async function cancelRefund(refundId: string): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(
      accountingUrl(`/api/v1/supplier-refunds/${refundId}/cancel`),
      {},
    );
    revalidatePath("/supplier-refunds");
    return { responseType: "success", message: "Refund cancelled" };
  } catch (error: unknown) {
    return {
      responseType: "error",
      message: error instanceof Error ? error.message : "Failed to cancel refund",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
