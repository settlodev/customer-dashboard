"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseStringify } from "@/lib/utils";
import ApiClient from "@/lib/settlo-api-client";
import { FormResponse } from "@/types/types";
import { StockCategory } from "@/types/stock-category/type";
import { StockCategorySchema } from "@/types/stock-category/schema";
import { inventoryUrl } from "./inventory-client";
import { rethrowIfBoundary } from "@/lib/list-fallback";

/** Every non-deleted stock category, including inactive ones. */
export async function fetchAllStockCategories(): Promise<StockCategory[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl("/api/v1/stock-categories"));
    return parseStringify(data) ?? [];
  } catch (error) {
    rethrowIfBoundary(error);
    return [];
  }
}

/** Assignment surfaces only — see StockCategory.active. */
export async function fetchActiveStockCategories(): Promise<StockCategory[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl("/api/v1/stock-categories?active=true"),
    );
    return parseStringify(data) ?? [];
  } catch (error) {
    rethrowIfBoundary(error);
    return [];
  }
}

export async function getStockCategory(id: string): Promise<StockCategory> {
  const apiClient = new ApiClient();
  const data = await apiClient.get(inventoryUrl(`/api/v1/stock-categories/${id}`));
  return parseStringify(data);
}

export async function createStockCategory(
  category: z.infer<typeof StockCategorySchema>,
  path: string,
): Promise<FormResponse<StockCategory>> {
  const validated = StockCategorySchema.safeParse(category);

  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill in all the required fields",
      error: new Error(validated.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();
    const response = await apiClient.post(inventoryUrl("/api/v1/stock-categories"), {
      name: validated.data.name,
      description: validated.data.description,
      active: validated.data.active,
    });

    revalidatePath(path);

    return parseStringify({
      responseType: "success",
      message: "Stock category created successfully",
      data: parseStringify(response),
    });
  } catch (error: any) {
    // The backend's duplicate-name message is merchant-readable, so surface
    // it rather than a generic string.
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create stock category",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function updateStockCategory(
  id: string,
  category: z.infer<typeof StockCategorySchema>,
): Promise<FormResponse | void> {
  const validated = StockCategorySchema.safeParse(category);

  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill in all the required fields",
      error: new Error(validated.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.put(inventoryUrl(`/api/v1/stock-categories/${id}`), {
      name: validated.data.name,
      description: validated.data.description,
      active: validated.data.active,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to update stock category",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }

  revalidatePath("/stock-categories");
  redirect("/stock-categories");
}

export async function deleteStockCategory(id: string): Promise<void> {
  if (!id) throw new Error("Stock category ID is required");

  const apiClient = new ApiClient();
  await apiClient.delete(inventoryUrl(`/api/v1/stock-categories/${id}`));
  revalidatePath("/stock-categories");
}
