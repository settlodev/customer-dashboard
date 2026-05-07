"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { getAuthToken } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { StockUsage } from "@/types/stock-usage/type";
import { StockUsageSchema } from "@/types/stock-usage/schema";
import { inventoryUrl } from "./inventory-client";
import { getCurrentDestination } from "./context";

export async function searchStockUsages(
  page: number = 0,
  size: number = 20,
  usageType?: string,
): Promise<ApiResponse<StockUsage>> {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", String(size));
    params.set("sortBy", "createdAt");
    params.set("sortDirection", "desc");
    if (usageType) params.set("usageType", usageType);

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
        recordedBy: token.userId,
        usageDate: validated.data.usageDate || new Date().toISOString(),
        stockVariantId: validated.data.stockVariantId,
        quantity: validated.data.quantity,
        usageType: validated.data.usageType,
        departmentId: validated.data.departmentId,
        notes: validated.data.notes,
      },
    )) as StockUsage;

    createdId = created?.id ?? null;
    revalidatePath("/stock-usages");
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to record stock usage",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }

  redirect(createdId ? `/stock-usages/${createdId}` : "/stock-usages");
}
