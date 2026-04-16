"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { StockTransfer, TransferStatus } from "@/types/stock-transfer/type";
import { StockTransferSchema } from "@/types/stock-transfer/schema";
import { inventoryUrl } from "./inventory-client";

export async function searchStockTransfers(
  page: number = 0,
  size: number = 20,
  direction: "outgoing" | "incoming" = "outgoing",
  status?: TransferStatus,
): Promise<ApiResponse<StockTransfer>> {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", String(size));
    params.set("direction", direction);
    params.set("sortBy", "createdAt");
    params.set("sortDirection", "desc");
    if (status) params.set("status", status);

    const data = await apiClient.get(
      inventoryUrl(`/api/v1/stock-transfers?${params.toString()}`),
    );
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
}

export async function getStockTransfer(id: string): Promise<StockTransfer | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl(`/api/v1/stock-transfers/${id}`));
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function createStockTransfer(
  transfer: z.infer<typeof StockTransferSchema>,
): Promise<FormResponse | void> {
  const validated = StockTransferSchema.safeParse(transfer);

  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all required fields",
      error: new Error(validated.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl("/api/v1/stock-transfers"), {
      sourceLocationType: "LOCATION",
      ...validated.data,
      transferDate: validated.data.transferDate || new Date().toISOString(),
    });

    revalidatePath("/stock-transfers");
    redirect("/stock-transfers");
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create stock transfer",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

// ── Transfer lifecycle actions ──────────────────────────────────────

export async function confirmTransfer(id: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl(`/api/v1/stock-transfers/${id}/confirm`), {});
  revalidatePath("/stock-transfers");
}

export async function dispatchTransfer(id: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl(`/api/v1/stock-transfers/${id}/dispatch`), {});
  revalidatePath("/stock-transfers");
}

export async function receiveTransfer(
  id: string,
  receivedBy: string,
  items?: { stockVariantId: string; receivedQuantity: number }[],
  notes?: string,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl(`/api/v1/stock-transfers/${id}/receive`), {
    receivedBy,
    notes,
    items,
  });
  revalidatePath("/stock-transfers");
}

export async function acceptTransfer(id: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl(`/api/v1/stock-transfers/${id}/accept`), {});
  revalidatePath("/stock-transfers");
}

export async function declineTransfer(id: string, reason?: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl(`/api/v1/stock-transfers/${id}/decline`), { reason });
  revalidatePath("/stock-transfers");
}

export async function returnTransfer(id: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl(`/api/v1/stock-transfers/${id}/return-to-source`), {});
  revalidatePath("/stock-transfers");
}

export async function confirmReturnTransfer(id: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl(`/api/v1/stock-transfers/${id}/confirm-return`), {});
  revalidatePath("/stock-transfers");
}

export async function cancelTransfer(id: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl(`/api/v1/stock-transfers/${id}/cancel`), {});
  revalidatePath("/stock-transfers");
}
