"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { StockIntakeRecord } from "@/types/stock-intake-record/type";
import { StockIntakeRecordSchema } from "@/types/stock-intake-record/schema";
import { inventoryUrl } from "./inventory-client";

export async function searchStockIntakeRecords(
  page: number = 0,
  size: number = 20,
  status?: string,
): Promise<ApiResponse<StockIntakeRecord>> {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", String(size));
    params.set("sortBy", "createdAt");
    params.set("sortDirection", "desc");
    if (status) params.set("status", status);

    const data = await apiClient.get(
      inventoryUrl(`/api/v1/stock-intakes?${params.toString()}`),
    );
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
}

export async function getStockIntakeRecord(id: string): Promise<StockIntakeRecord | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl(`/api/v1/stock-intakes/${id}`));
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function createStockIntakeRecord(
  stockIntake: z.infer<typeof StockIntakeRecordSchema>,
): Promise<FormResponse | void> {
  const validated = StockIntakeRecordSchema.safeParse(stockIntake);

  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all required fields",
      error: new Error(validated.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();

    // Create intake (DRAFT)
    const created = (await apiClient.post(
      inventoryUrl("/api/v1/stock-intakes"),
      { locationType: "LOCATION", ...validated.data },
    )) as StockIntakeRecord;

    // Immediately confirm — creates PURCHASE movements, batches, and updates balances
    await apiClient.post(
      inventoryUrl(`/api/v1/stock-intakes/${created.id}/confirm`),
      {},
    );

    revalidatePath("/stock-intakes");
    redirect("/stock-intakes");
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create stock intake",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function confirmStockIntakeRecord(id: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl(`/api/v1/stock-intakes/${id}/confirm`), {});
  revalidatePath("/stock-intakes");
  revalidatePath(`/stock-intakes/${id}`);
}

export async function cancelStockIntakeRecord(id: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl(`/api/v1/stock-intakes/${id}/cancel`), {});
  revalidatePath("/stock-intakes");
  revalidatePath(`/stock-intakes/${id}`);
}
