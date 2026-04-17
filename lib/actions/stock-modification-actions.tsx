"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { getAuthToken } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { StockModification } from "@/types/stock-modification/type";
import { StockModificationSchema } from "@/types/stock-modification/schema";
import { inventoryUrl } from "./inventory-client";

export async function searchStockModifications(
  page: number = 0,
  size: number = 20,
  category?: string,
): Promise<ApiResponse<StockModification>> {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", String(size));
    params.set("sortBy", "createdAt");
    params.set("sortDirection", "desc");
    if (category) params.set("category", category);

    const data = await apiClient.get(
      inventoryUrl(`/api/v1/stock-modifications?${params.toString()}`),
    );
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
}

export async function getStockModification(id: string): Promise<StockModification | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl(`/api/v1/stock-modifications/${id}`));
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function createStockModification(
  modification: z.infer<typeof StockModificationSchema>,
): Promise<FormResponse | void> {
  const validated = StockModificationSchema.safeParse(modification);

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
      inventoryUrl("/api/v1/stock-modifications"),
      {
        locationType: "LOCATION",
        performedBy: token.userId,
        modificationDate: validated.data.modificationDate || new Date().toISOString(),
        category: validated.data.category,
        reason: validated.data.reason,
        notes: validated.data.notes,
        items: validated.data.items,
      },
    )) as StockModification;

    createdId = created?.id ?? null;
    revalidatePath("/stock-modifications");
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create stock modification",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }

  redirect(createdId ? `/stock-modifications/${createdId}` : "/stock-modifications");
}
