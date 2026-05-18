"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { getAuthToken } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  StockUsage,
  StockUsageFilters,
  StockUsageSummaryRow,
  UsageGrouping,
} from "@/types/stock-usage/type";
import {
  ReverseStockUsageSchema,
  StockUsageSchema,
} from "@/types/stock-usage/schema";
import { inventoryUrl } from "./inventory-client";
import { getCurrentDestination } from "./context";

export async function searchStockUsages(
  page: number = 0,
  size: number = 20,
  filters: StockUsageFilters = {},
): Promise<ApiResponse<StockUsage>> {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", String(size));
    params.set("sortBy", "createdAt");
    params.set("sortDirection", "desc");
    if (filters.category) params.set("category", filters.category);
    if (filters.departmentId) params.set("departmentId", filters.departmentId);
    if (filters.recipientId) params.set("recipientId", filters.recipientId);
    if (filters.performedBy) params.set("performedBy", filters.performedBy);
    if (filters.status) params.set("status", filters.status);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);

    const data = await apiClient.get(
      inventoryUrl(`/api/v1/stock-usages?${params.toString()}`),
    );
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
}

export async function getStockUsage(id: string): Promise<StockUsage | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl(`/api/v1/stock-usages/${id}`));
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function getStockUsageSummary(
  from: string,
  to: string,
  groupBy: UsageGrouping,
): Promise<StockUsageSummaryRow[]> {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams();
    params.set("from", from);
    params.set("to", to);
    params.set("groupBy", groupBy);
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/stock-usages/summary?${params.toString()}`),
    );
    return parseStringify(data) as StockUsageSummaryRow[];
  } catch {
    return [];
  }
}

export async function createStockUsage(
  usage: z.infer<typeof StockUsageSchema>,
): Promise<FormResponse | void> {
  const validated = StockUsageSchema.safeParse(usage);

  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all required fields",
      error: new Error(validated.error.message),
    });
  }

  const token = await getAuthToken();
  if (!token?.userId) {
    return parseStringify({
      responseType: "error",
      message: "Your session has expired. Please log in again.",
      error: new Error("Missing userId in auth token"),
    });
  }

  let createdId: string | null = null;
  try {
    const apiClient = new ApiClient();
    const created = (await apiClient.post(
      inventoryUrl("/api/v1/stock-usages"),
      {
        locationType: (await getCurrentDestination())?.type ?? "LOCATION",
        category: validated.data.category,
        purpose: validated.data.purpose,
        recipientId: validated.data.recipientId,
        departmentId: validated.data.departmentId,
        performedBy: token.userId,
        usageDate: validated.data.usageDate || new Date().toISOString(),
        notes: validated.data.notes,
        items: validated.data.items.map((item) => ({
          stockVariantId: item.stockVariantId,
          quantity: item.quantity,
          unitCost:
            typeof item.unitCost === "number" && !Number.isNaN(item.unitCost)
              ? item.unitCost
              : undefined,
          batchId: item.batchId,
          serialNumbers:
            item.serialNumbers && item.serialNumbers.length > 0
              ? item.serialNumbers
              : undefined,
          notes: item.notes,
        })),
      },
    )) as StockUsage;

    createdId = created?.id ?? null;
    revalidatePath("/stock-usages");
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return parseStringify({
      responseType: "error",
      message: formatApiError(error, "Failed to record stock usage"),
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }

  redirect(createdId ? `/stock-usages/${createdId}` : "/stock-usages");
}

/**
 * Format an API error for display. When the backend returns
 * {@code VALIDATION_ERROR} with a {@code fieldErrors} array, append a
 * compact "field: message" list so the user can see exactly which input
 * was rejected — the generic "One or more fields failed validation"
 * top-line is useless on its own.
 */
function formatApiError(error: any, fallback: string): string {
  const message: string = error?.message ?? fallback;
  const details: unknown = error?.details;
  if (Array.isArray(details) && details.length > 0) {
    const parts: string[] = [];
    for (const d of details as Array<{ field?: string; message?: string }>) {
      if (d?.field && d?.message) parts.push(`${d.field}: ${d.message}`);
      else if (d?.message) parts.push(d.message);
    }
    if (parts.length > 0) return `${message} — ${parts.join("; ")}`;
  }
  return message;
}

export async function reverseStockUsage(
  id: string,
  payload: z.infer<typeof ReverseStockUsageSchema>,
): Promise<FormResponse> {
  const validated = ReverseStockUsageSchema.safeParse(payload);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please provide a reason for the reversal",
      error: new Error(validated.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.post(
      inventoryUrl(`/api/v1/stock-usages/${id}/reverse`),
      { reason: validated.data.reason },
    );
    revalidatePath("/stock-usages");
    revalidatePath(`/stock-usages/${id}`);
    return parseStringify({
      responseType: "success",
      message: "Stock usage reversed",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: formatApiError(error, "Failed to reverse stock usage"),
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
