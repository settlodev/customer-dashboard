"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { inventoryUrl } from "./inventory-client";
import { getCurrentDestination } from "./context";
import type {
  SupplierReturn,
  SupplierReturnStatus,
  CreateSupplierReturnPayload,
} from "@/types/supplier-return/type";
import { CreateSupplierReturnSchema } from "@/types/supplier-return/schema";

const BASE = "/api/v1/supplier-returns";

export async function getSupplierReturns(
  page: number = 0,
  size: number = 20,
  status?: SupplierReturnStatus,
): Promise<ApiResponse<SupplierReturn>> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("size", String(size));
  params.set("sortBy", "createdAt");
  params.set("sortDirection", "DESC");
  if (status) params.set("status", status);

  const apiClient = new ApiClient();
  const data = await apiClient.get(inventoryUrl(`${BASE}?${params.toString()}`));
  return parseStringify(data);
}

export async function getSupplierReturn(id: string): Promise<SupplierReturn | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl(`${BASE}/${id}`));
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function createSupplierReturn(
  input: z.infer<typeof CreateSupplierReturnSchema>,
): Promise<FormResponse<{ id: string | null }>> {
  const validated = CreateSupplierReturnSchema.safeParse(input);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fix the highlighted fields",
      error: new Error(validated.error.message),
    });
  }
  const payload: CreateSupplierReturnPayload = {
    ...validated.data,
    locationType: (await getCurrentDestination())?.type ?? "LOCATION",
    grnId: validated.data.grnId || undefined,
    items: validated.data.items.map((item) => ({
      ...item,
      currency: item.currency || undefined,
    })),
  };

  try {
    const apiClient = new ApiClient();
    const created = (await apiClient.post(
      inventoryUrl(BASE),
      payload,
    )) as SupplierReturn;
    revalidatePath("/supplier-returns");
    return parseStringify({
      responseType: "success",
      message: "Supplier return saved as Draft",
      data: { id: created?.id ?? null },
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create supplier return",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function confirmSupplierReturn(id: string): Promise<FormResponse> {
  return runTransition(id, "confirm", "Confirmed");
}
export async function dispatchSupplierReturn(id: string): Promise<FormResponse> {
  return runTransition(id, "dispatch", "Dispatched");
}
export async function completeSupplierReturn(id: string): Promise<FormResponse> {
  return runTransition(id, "complete", "Completed");
}
export async function cancelSupplierReturn(id: string): Promise<FormResponse> {
  return runTransition(id, "cancel", "Cancelled");
}

async function runTransition(
  id: string,
  verb: "confirm" | "dispatch" | "complete" | "cancel",
  label: string,
): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl(`${BASE}/${id}/${verb}`), {});
    revalidatePath(`/supplier-returns/${id}`);
    revalidatePath("/supplier-returns");
    return parseStringify({
      responseType: "success",
      message: `Supplier return ${label.toLowerCase()}`,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? `Failed to ${label.toLowerCase()}`,
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
