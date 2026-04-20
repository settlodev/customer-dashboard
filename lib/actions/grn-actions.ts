"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { inventoryUrl } from "./inventory-client";
import type {
  Grn,
  LandedCost,
  CreateGrnPayload,
  AddLandedCostPayload,
  RecordInspectionPayload,
} from "@/types/grn/type";
import {
  AddLandedCostSchema,
  CreateGrnSchema,
  RecordInspectionSchema,
} from "@/types/grn/schema";

const BASE = "/api/v1/grns";

// ── List / read ─────────────────────────────────────────────────────

export async function getGrns(
  page: number = 0,
  size: number = 20,
  sortBy: string = "createdAt",
  sortDirection: "asc" | "desc" = "desc",
): Promise<ApiResponse<Grn>> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("size", String(size));
  params.set("sortBy", sortBy);
  params.set("sortDirection", sortDirection);

  const apiClient = new ApiClient();
  const data = await apiClient.get(inventoryUrl(`${BASE}?${params.toString()}`));
  return parseStringify(data);
}

export async function getGrn(id: string): Promise<Grn | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl(`${BASE}/${id}`));
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function getLandedCosts(grnId: string): Promise<LandedCost[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl(`${BASE}/${grnId}/landed-costs`));
    return parseStringify(data) ?? [];
  } catch {
    return [];
  }
}

// ── Mutations ───────────────────────────────────────────────────────

export async function createGrn(
  input: z.infer<typeof CreateGrnSchema>,
): Promise<FormResponse | void> {
  const validated = CreateGrnSchema.safeParse(input);

  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fix the highlighted fields",
      error: new Error(validated.error.message),
    });
  }

  const { lpoId, ...rest } = validated.data;
  const payload: CreateGrnPayload = {
    ...rest,
    locationType: "LOCATION",
    lpoId: lpoId && lpoId.length > 0 ? lpoId : undefined,
    receivedDate: new Date(rest.receivedDate).toISOString(),
    items: rest.items.map((item) => ({
      ...item,
      serialNumbers:
        item.serialNumbers && item.serialNumbers.length > 0
          ? item.serialNumbers
          : undefined,
      expiryDate: item.expiryDate || undefined,
      batchNumber: item.batchNumber || undefined,
      supplierBatchReference: item.supplierBatchReference || undefined,
    })),
  };

  let createdId: string | null = null;
  try {
    const apiClient = new ApiClient();
    const created = (await apiClient.post(inventoryUrl(BASE), payload)) as Grn;
    createdId = created?.id ?? null;
    revalidatePath("/goods-received");
    revalidatePath("/stock-intakes");
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create GRN",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }

  redirect(createdId ? `/goods-received/${createdId}` : "/goods-received");
}

export async function receiveGrn(id: string): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl(`${BASE}/${id}/receive`), {});
    revalidatePath("/goods-received");
    revalidatePath(`/goods-received/${id}`);
    revalidatePath("/stock-intakes");
    return { responseType: "success", message: "GRN received into inventory" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to receive GRN",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function cancelGrn(id: string): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl(`${BASE}/${id}/cancel`), {});
    revalidatePath("/goods-received");
    revalidatePath(`/goods-received/${id}`);
    return { responseType: "success", message: "GRN cancelled" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to cancel GRN",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function submitGrnForInspection(id: string): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl(`${BASE}/${id}/inspect`), {});
    revalidatePath("/goods-received");
    revalidatePath(`/goods-received/${id}`);
    return { responseType: "success", message: "GRN put on inspection hold" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to submit for inspection",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function recordInspection(
  grnId: string,
  itemId: string,
  input: z.infer<typeof RecordInspectionSchema>,
): Promise<FormResponse> {
  const validated = RecordInspectionSchema.safeParse(input);
  if (!validated.success) {
    return {
      responseType: "error",
      message: "Please fix the highlighted fields",
      error: new Error(validated.error.message),
    };
  }

  const payload: RecordInspectionPayload = validated.data;

  try {
    const apiClient = new ApiClient();
    await apiClient.post(
      inventoryUrl(`${BASE}/${grnId}/items/${itemId}/inspection`),
      payload,
    );
    revalidatePath(`/goods-received/${grnId}`);
    return { responseType: "success", message: "Inspection recorded" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to record inspection",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function addLandedCost(
  grnId: string,
  input: z.infer<typeof AddLandedCostSchema>,
): Promise<FormResponse<LandedCost>> {
  const validated = AddLandedCostSchema.safeParse(input);
  if (!validated.success) {
    return {
      responseType: "error",
      message: "Please fix the highlighted fields",
      error: new Error(validated.error.message),
    };
  }

  const payload: AddLandedCostPayload = validated.data;

  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      inventoryUrl(`${BASE}/${grnId}/landed-costs`),
      payload,
    )) as LandedCost;
    revalidatePath(`/goods-received/${grnId}`);
    return {
      responseType: "success",
      message: "Landed cost added",
      data: parseStringify(data),
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to add landed cost",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
