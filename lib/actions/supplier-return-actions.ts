"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { inventoryUrl } from "./inventory-client";
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
): Promise<FormResponse | void> {
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
    locationType: "LOCATION",
    grnId: validated.data.grnId || undefined,
    items: validated.data.items.map((item) => ({
      ...item,
      currency: item.currency || undefined,
    })),
  };

  let createdId: string | null = null;
  try {
    const apiClient = new ApiClient();
    const created = (await apiClient.post(
      inventoryUrl(BASE),
      payload,
    )) as SupplierReturn;
    createdId = created?.id ?? null;
    revalidatePath("/supplier-returns");
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create supplier return",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
  redirect(createdId ? `/supplier-returns/${createdId}` : "/supplier-returns");
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
    return { responseType: "success", message: `Return ${label.toLowerCase()}` };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? `Failed to ${label.toLowerCase()}`,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
