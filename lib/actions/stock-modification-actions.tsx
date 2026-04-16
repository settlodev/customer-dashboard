"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
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

  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl("/api/v1/stock-modifications"), {
      locationType: "LOCATION",
      ...validated.data,
      modificationDate: validated.data.modificationDate || new Date().toISOString(),
    });

    revalidatePath("/stock-modifications");
    redirect("/stock-modifications");
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create stock modification",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
