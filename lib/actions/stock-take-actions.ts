"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { inventoryUrl } from "./inventory-client";
import type {
  StockTake,
  StockTakeStatus,
  CreateStockTakePayload,
  RecordCountPayload,
} from "@/types/stock-take/type";
import { CreateStockTakeSchema, RecordCountSchema } from "@/types/stock-take/schema";

const BASE = "/api/v1/stock-takes";

export async function getStockTakes(
  page: number = 0,
  size: number = 20,
  status?: StockTakeStatus,
): Promise<ApiResponse<StockTake>> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("size", String(size));
  if (status) params.set("status", status);

  const apiClient = new ApiClient();
  const data = await apiClient.get(inventoryUrl(`${BASE}?${params.toString()}`));
  return parseStringify(data);
}

export async function getStockTake(id: string): Promise<StockTake | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl(`${BASE}/${id}`));
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function createStockTake(
  input: z.infer<typeof CreateStockTakeSchema>,
): Promise<FormResponse | void> {
  const validated = CreateStockTakeSchema.safeParse(input);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fix the highlighted fields",
      error: new Error(validated.error.message),
    });
  }

  const payload: CreateStockTakePayload = {
    locationType: "LOCATION",
    ...validated.data,
  };

  let createdId: string | null = null;
  try {
    const apiClient = new ApiClient();
    const created = (await apiClient.post(inventoryUrl(BASE), payload)) as StockTake;
    createdId = created?.id ?? null;
    revalidatePath("/stock-takes");
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create stock take",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
  redirect(createdId ? `/stock-takes/${createdId}` : "/stock-takes");
}

export async function startStockTake(id: string): Promise<FormResponse> {
  return runTransition(id, "start", "Started");
}
export async function completeStockTake(id: string): Promise<FormResponse> {
  return runTransition(id, "complete", "Completed");
}
export async function approveStockTake(id: string): Promise<FormResponse> {
  return runTransition(id, "approve", "Approved");
}
export async function cancelStockTake(id: string): Promise<FormResponse> {
  return runTransition(id, "cancel", "Cancelled");
}

async function runTransition(
  id: string,
  verb: "start" | "complete" | "approve" | "cancel",
  label: string,
): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl(`${BASE}/${id}/${verb}`), {});
    revalidatePath(`/stock-takes/${id}`);
    revalidatePath("/stock-takes");
    return { responseType: "success", message: `Stock take ${label.toLowerCase()}` };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? `Failed to ${label.toLowerCase()}`,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function recordStockTakeCount(
  takeId: string,
  input: z.infer<typeof RecordCountSchema>,
): Promise<FormResponse> {
  const validated = RecordCountSchema.safeParse(input);
  if (!validated.success) {
    return {
      responseType: "error",
      message: "Invalid count",
      error: new Error(validated.error.message),
    };
  }

  const payload: RecordCountPayload = validated.data;

  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl(`${BASE}/${takeId}/count`), payload);
    revalidatePath(`/stock-takes/${takeId}`);
    return { responseType: "success", message: "Count recorded" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to record count",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
