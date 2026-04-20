"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { inventoryUrl } from "./inventory-client";
import type {
  PurchaseRequisition,
  RequisitionStatus,
  CreateRequisitionPayload,
} from "@/types/requisition/type";
import {
  CreateRequisitionSchema,
  RejectRequisitionSchema,
} from "@/types/requisition/schema";

const BASE = "/api/v1/purchase-requisitions";

export async function getRequisitions(
  page: number = 0,
  size: number = 20,
  status?: RequisitionStatus,
  sortBy: string = "createdAt",
  sortDirection: "asc" | "desc" = "desc",
): Promise<ApiResponse<PurchaseRequisition>> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("size", String(size));
  params.set("sortBy", sortBy);
  params.set("sortDirection", sortDirection);
  if (status) params.set("status", status);

  const apiClient = new ApiClient();
  const data = await apiClient.get(inventoryUrl(`${BASE}?${params.toString()}`));
  return parseStringify(data);
}

export async function getRequisition(id: string): Promise<PurchaseRequisition | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl(`${BASE}/${id}`));
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function createRequisition(
  input: z.infer<typeof CreateRequisitionSchema>,
): Promise<FormResponse | void> {
  const validated = CreateRequisitionSchema.safeParse(input);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fix the highlighted fields",
      error: new Error(validated.error.message),
    });
  }

  const payload: CreateRequisitionPayload = {
    locationType: "LOCATION",
    ...validated.data,
    items: validated.data.items.map((item) => ({
      ...item,
      preferredSupplierId: item.preferredSupplierId || undefined,
    })),
  };

  let createdId: string | null = null;
  try {
    const apiClient = new ApiClient();
    const created = (await apiClient.post(
      inventoryUrl(BASE),
      payload,
    )) as PurchaseRequisition;
    createdId = created?.id ?? null;
    revalidatePath("/purchase-requisitions");
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create requisition",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
  redirect(createdId ? `/purchase-requisitions/${createdId}` : "/purchase-requisitions");
}

export async function submitRequisition(id: string): Promise<FormResponse> {
  return runTransition(id, "submit", "Submitted");
}

export async function approveRequisition(id: string): Promise<FormResponse> {
  return runTransition(id, "approve", "Approved");
}

export async function rejectRequisition(
  id: string,
  input: z.infer<typeof RejectRequisitionSchema>,
): Promise<FormResponse> {
  const validated = RejectRequisitionSchema.safeParse(input);
  if (!validated.success) {
    return {
      responseType: "error",
      message: "Reason is required",
      error: new Error(validated.error.message),
    };
  }
  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl(`${BASE}/${id}/reject`), validated.data);
    revalidatePath(`/purchase-requisitions/${id}`);
    revalidatePath("/purchase-requisitions");
    return { responseType: "success", message: "Requisition rejected" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to reject",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function convertRequisitionToLpo(id: string): Promise<FormResponse> {
  return runTransition(id, "convert-to-lpo", "Converted to LPO");
}

export async function cancelRequisition(id: string): Promise<FormResponse> {
  return runTransition(id, "cancel", "Cancelled");
}

async function runTransition(
  id: string,
  verb: "submit" | "approve" | "convert-to-lpo" | "cancel",
  label: string,
): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl(`${BASE}/${id}/${verb}`), {});
    revalidatePath(`/purchase-requisitions/${id}`);
    revalidatePath("/purchase-requisitions");
    return { responseType: "success", message: `Requisition ${label.toLowerCase()}` };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? `Failed to ${label.toLowerCase()}`,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
