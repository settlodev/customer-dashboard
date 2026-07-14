"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  DestinationOption,
  StockTransfer,
  TransferStatus,
} from "@/types/stock-transfer/type";
import { StockTransferSchema } from "@/types/stock-transfer/schema";
import { inventoryUrl } from "./inventory-client";
import { getCurrentDestination } from "./context";
import { fetchAllLocations } from "./location-actions";
import { fetchAllStores } from "./store-actions";
import { getWarehouses } from "./warehouse/list-warehouse";

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

/**
 * Valid transfer destinations for the current workspace: every location, store
 * and warehouse the caller can access in the active business, flattened into a
 * single list and with the active source excluded (you can't transfer to
 * yourself). Inactive destinations are dropped because the backend rejects them
 * on create. Each source list is fetched independently so one failing service
 * doesn't blank out the whole picker.
 */
export async function getTransferDestinations(): Promise<DestinationOption[]> {
  const [source, results] = await Promise.all([
    getCurrentDestination(),
    Promise.allSettled([fetchAllLocations(), fetchAllStores(), getWarehouses()]),
  ]);
  const [locationsRes, storesRes, warehousesRes] = results;

  const options: DestinationOption[] = [];

  if (locationsRes.status === "fulfilled") {
    for (const loc of locationsRes.value) {
      if (!loc.active) continue;
      options.push({
        id: loc.id,
        name: loc.name,
        type: "LOCATION",
        subline: loc.region || undefined,
      });
    }
  }

  if (warehousesRes.status === "fulfilled") {
    for (const wh of warehousesRes.value) {
      if (!wh.active) continue;
      const parts = [wh.code, wh.primary ? "Primary" : null].filter(Boolean);
      options.push({
        id: wh.id,
        name: wh.name,
        type: "WAREHOUSE",
        subline: parts.length ? parts.join(" · ") : undefined,
      });
    }
  }

  if (storesRes.status === "fulfilled") {
    // When the source is a store, store→store transfers are restricted to
    // sibling stores under the same parent location (the backend enforces
    // this authoritatively). Fail open if the source's parent can't be
    // determined — let the backend reject rather than hide everything.
    const sourceStoreParentId =
      source?.type === "STORE"
        ? storesRes.value.find((s) => s.id === source.id)?.locationId ?? null
        : null;
    for (const st of storesRes.value) {
      if (!st.active) continue;
      if (sourceStoreParentId && st.locationId !== sourceStoreParentId) continue;
      options.push({
        id: st.id,
        name: st.name,
        type: "STORE",
        subline: st.code || undefined,
      });
    }
  }

  return source ? options.filter((o) => o.id !== source.id) : options;
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

  // The source is the active destination. The backend resolves the source *id*
  // from the X-Location-Id header; we send the matching source *type* so a
  // transfer started from a store/warehouse context isn't mislabeled as a
  // location. Guard against transferring to the source itself.
  const source = await getCurrentDestination();
  if (!source) {
    return parseStringify({
      responseType: "error",
      message:
        "No active location selected. Choose a workspace before creating a transfer.",
      error: new Error("No active destination"),
    });
  }
  if (validated.data.destinationLocationId === source.id) {
    return parseStringify({
      responseType: "error",
      message: "The destination must be different from the source location.",
      error: new Error("Source and destination are the same"),
    });
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl("/api/v1/stock-transfers"), {
      sourceLocationType: source.type,
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
  items?: { stockVariantId: string; receivedQuantity: number }[],
  notes?: string,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl(`/api/v1/stock-transfers/${id}/receive`), {
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

export async function rejectTransfer(id: string, reason?: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(inventoryUrl(`/api/v1/stock-transfers/${id}/reject`), { reason });
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
