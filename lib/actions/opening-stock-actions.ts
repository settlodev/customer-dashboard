"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { OpeningStock } from "@/types/opening-stock/type";
import { OpeningStockSchema } from "@/types/opening-stock/schema";
import { inventoryUrl } from "./inventory-client";

export async function searchOpeningStocks(
  page: number = 0,
  size: number = 20,
  status?: string,
): Promise<ApiResponse<OpeningStock>> {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", String(size));
    params.set("sortBy", "createdAt");
    params.set("sortDirection", "desc");
    if (status) params.set("status", status);

    const data = await apiClient.get(
      inventoryUrl(`/api/v1/opening-stocks?${params.toString()}`),
    );
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
}

export async function getOpeningStock(id: string): Promise<OpeningStock | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl(`/api/v1/opening-stocks/${id}`));
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function createOpeningStock(
  openingStock: z.infer<typeof OpeningStockSchema>,
): Promise<FormResponse | void> {
  const validated = OpeningStockSchema.safeParse(openingStock);

  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all required fields",
      error: new Error(validated.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();

    // Create opening stock (DRAFT)
    const created = (await apiClient.post(
      inventoryUrl("/api/v1/opening-stocks"),
      { locationType: "LOCATION", ...validated.data },
    )) as OpeningStock;

    // Immediately confirm — creates movements, batches, and updates balances
    await apiClient.post(
      inventoryUrl(`/api/v1/opening-stocks/${created.id}/confirm`),
      {},
    );

    revalidatePath("/stock-intakes");
    redirect("/stock-intakes");
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create opening stock",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function confirmOpeningStock(id: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl(`/api/v1/opening-stocks/${id}/confirm`), {});
  revalidatePath("/stock-intakes");
  revalidatePath(`/stock-intakes/${id}`);
}

export async function cancelOpeningStock(id: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl(`/api/v1/opening-stocks/${id}/cancel`), {});
  revalidatePath("/stock-intakes");
  revalidatePath(`/stock-intakes/${id}`);
}
