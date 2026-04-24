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
  CycleCountType,
  CreateStockTakePayload,
  RecordCountPayload,
} from "@/types/stock-take/type";
import { CreateStockTakeSchema, RecordCountSchema } from "@/types/stock-take/schema";

const BASE = "/api/v1/stock-takes";

export interface StockTakePreview {
  cycleCountType: CycleCountType;
  matchCount: number;
  variantCount: number;
  totalExpectedQuantity: number | null;
}

export async function getStockTakes(
  page: number = 0,
  size: number = 20,
  status?: StockTakeStatus,
  cycleCountType?: CycleCountType,
): Promise<ApiResponse<StockTake>> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("size", String(size));
  if (status) params.set("status", status);
  if (cycleCountType) params.set("cycleCountType", cycleCountType);

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

  const {
    locationType,
    cycleCountType,
    blindCount,
    notes,
    abcClass,
    zoneId,
    sampleMode,
    sampleSize,
    samplePercentage,
  } = validated.data;

  const payload: CreateStockTakePayload = {
    locationType,
    cycleCountType,
    blindCount,
    notes: notes?.trim() ? notes.trim() : undefined,
    filterCriteria: buildFilterCriteria({
      cycleCountType,
      abcClass,
      zoneId,
      sampleMode,
      sampleSize,
      samplePercentage,
    }),
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

function buildFilterCriteria(args: {
  cycleCountType: z.infer<typeof CreateStockTakeSchema>["cycleCountType"];
  abcClass?: "A" | "B" | "C";
  zoneId?: string;
  sampleMode?: "size" | "percentage";
  sampleSize?: number;
  samplePercentage?: number;
}): string | undefined {
  switch (args.cycleCountType) {
    case "ABC_CLASS":
      return args.abcClass ? JSON.stringify({ classification: args.abcClass }) : undefined;
    case "ZONE":
      return args.zoneId ? JSON.stringify({ zoneId: args.zoneId }) : undefined;
    case "RANDOM":
      if (args.sampleMode === "size" && args.sampleSize != null) {
        return JSON.stringify({ sampleSize: args.sampleSize });
      }
      if (args.sampleMode === "percentage" && args.samplePercentage != null) {
        return JSON.stringify({ samplePercentage: args.samplePercentage });
      }
      return undefined;
    case "FULL":
    default:
      return undefined;
  }
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

export async function updateStockTakeDraft(
  id: string,
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

  const {
    locationType,
    cycleCountType,
    blindCount,
    notes,
    abcClass,
    zoneId,
    sampleMode,
    sampleSize,
    samplePercentage,
  } = validated.data;

  const payload = {
    locationType,
    cycleCountType,
    blindCount,
    notes: notes?.trim() ? notes.trim() : null,
    filterCriteria: buildFilterCriteria({
      cycleCountType,
      abcClass,
      zoneId,
      sampleMode,
      sampleSize,
      samplePercentage,
    }) ?? null,
  };

  try {
    const apiClient = new ApiClient();
    await apiClient.patch(inventoryUrl(`${BASE}/${id}`), payload);
    revalidatePath(`/stock-takes/${id}`);
    revalidatePath("/stock-takes");
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to update stock take",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
  redirect(`/stock-takes/${id}`);
}

export async function getStockTakePreview(
  input: z.infer<typeof CreateStockTakeSchema>,
): Promise<StockTakePreview | null> {
  const validated = CreateStockTakeSchema.safeParse(input);
  if (!validated.success) return null;

  const {
    locationType,
    cycleCountType,
    abcClass,
    zoneId,
    sampleMode,
    sampleSize,
    samplePercentage,
  } = validated.data;

  const payload = {
    locationType,
    cycleCountType,
    filterCriteria: buildFilterCriteria({
      cycleCountType,
      abcClass,
      zoneId,
      sampleMode,
      sampleSize,
      samplePercentage,
    }),
  };

  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      inventoryUrl(`${BASE}/preview`),
      payload,
    )) as StockTakePreview;
    return parseStringify(data);
  } catch {
    return null;
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
