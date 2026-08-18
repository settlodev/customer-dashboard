"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { DestinationOption } from "@/types/stock-transfer/type";
import type {
  TransferRequest,
  TransferRequestStatus,
} from "@/types/stock-transfer-request/type";
import { TransferRequestSchema } from "@/types/stock-transfer-request/schema";
import { inventoryUrl } from "./inventory-client";
import { getCurrentDestination } from "./context";
import { fetchAllLocations } from "./location-actions";
import { fetchAllStores, getCurrentStore } from "./store-actions";
import { getWarehouses } from "./warehouse/list-warehouse";
import { getAuthToken } from "@/lib/auth-utils";

/**
 * List transfer requests visible to the active destination.
 *
 *  - `direction=outgoing` (default): requests the active destination RAISED
 *    (caller is the requester) — the "Raised" inbox.
 *  - `direction=incoming`: requests where the active destination is the SOURCE
 *    (caller approves/declines) — the "To approve" inbox.
 *
 * The server reads the active destination from the X-Location-Id header the
 * ApiClient injects, so it isn't sent in the query.
 */
export async function searchTransferRequests(
  page: number = 0,
  size: number = 20,
  direction: "outgoing" | "incoming" = "outgoing",
  status?: TransferRequestStatus,
): Promise<ApiResponse<TransferRequest>> {
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
      inventoryUrl(`/api/v1/stock-transfer-requests?${params.toString()}`),
    );
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
}

export async function getTransferRequest(
  id: string,
): Promise<TransferRequest | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/stock-transfer-requests/${id}`),
    );
    return parseStringify(data);
  } catch {
    return null;
  }
}

/**
 * Valid sources the active destination may request stock FROM. The active
 * destination is the requester; only routes the backend accepts are offered:
 *
 *  - active = LOCATION → its child STORES (store.locationId === activeLocationId),
 *    every active WAREHOUSE, and other active LOCATIONS (self excluded).
 *  - active = STORE    → its parent LOCATION only (id === activeStore.locationId).
 *  - active = WAREHOUSE / none → no valid sources.
 *
 * Each source list is fetched independently so one failing service doesn't
 * blank out the whole picker (mirrors getTransferDestinations).
 */
export async function getRequestSources(): Promise<DestinationOption[]> {
  const source = await getCurrentDestination();
  if (!source) return [];

  // A store can only pull from its parent location.
  if (source.type === "STORE") {
    const parentLocationId = (await getCurrentStore())?.locationId;
    if (!parentLocationId) return [];
    try {
      const locations = await fetchAllLocations();
      const parent = locations.find(
        (loc) => loc.id === parentLocationId && loc.active,
      );
      if (!parent) return [];
      return [
        {
          id: parent.id,
          name: parent.name,
          type: "LOCATION",
          subline: parent.region || undefined,
        },
      ];
    } catch {
      return [];
    }
  }

  // A location can pull from its child stores, any warehouse, or another location.
  if (source.type === "LOCATION") {
    const activeLocationId = source.id;
    const [locationsRes, storesRes, warehousesRes] = await Promise.allSettled([
      fetchAllLocations(),
      fetchAllStores(),
      getWarehouses(),
    ]);

    const options: DestinationOption[] = [];

    if (locationsRes.status === "fulfilled") {
      for (const loc of locationsRes.value) {
        if (!loc.active) continue;
        if (loc.id === activeLocationId) continue; // can't request from yourself
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
      for (const st of storesRes.value) {
        if (!st.active) continue;
        if (st.locationId !== activeLocationId) continue; // child stores only
        options.push({
          id: st.id,
          name: st.name,
          type: "STORE",
          subline: st.code || undefined,
        });
      }
    }

    return options;
  }

  // Warehouses have no defined request sources in this flow.
  return [];
}

export async function createTransferRequest(
  data: z.infer<typeof TransferRequestSchema>,
): Promise<FormResponse | void> {
  const validated = TransferRequestSchema.safeParse(data);

  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all required fields",
      error: new Error(validated.error.message),
    });
  }

  // The requester is the active destination — the backend resolves its *id*
  // from the X-Location-Id header, so we send only the matching *type*. The
  // requesting user is resolved from the auth token, never trusted from the
  // client.
  const [source, authToken] = await Promise.all([
    getCurrentDestination(),
    getAuthToken(),
  ]);

  if (!source) {
    return parseStringify({
      responseType: "error",
      message:
        "No active location selected. Choose a workspace before raising a request.",
      error: new Error("No active destination"),
    });
  }
  if (!authToken?.userId) {
    return parseStringify({
      responseType: "error",
      message: "Your session has expired. Sign in again to raise a request.",
      error: new Error("No authenticated user"),
    });
  }
  if (validated.data.sourceLocationId === source.id) {
    return parseStringify({
      responseType: "error",
      message: "The source must be different from your current location.",
      error: new Error("Source and requester are the same"),
    });
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl("/api/v1/stock-transfer-requests"), {
      requestingLocationType: source.type,
      sourceLocationType: validated.data.sourceLocationType,
      sourceLocationId: validated.data.sourceLocationId,
      requestedBy: authToken.userId,
      notes: validated.data.notes,
      items: validated.data.items.map((item) => ({
        stockVariantId: item.stockVariantId,
        requestedQuantity: item.requestedQuantity,
        notes: item.notes,
      })),
    });

    revalidatePath("/stock-requests");
    redirect("/stock-requests");
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create stock request",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

// ── Request lifecycle actions ───────────────────────────────────────

/**
 * Approve an incoming request (caller is the source). Omitting `items`
 * approves every line at its requestedQuantity. Each approvedQuantity must be
 * 0..requestedQuantity — 0 drops that line, and at least one line must remain
 * above zero. Approval mints a StockTransfer the source then dispatches.
 */
export async function approveTransferRequest(
  id: string,
  items?: { stockVariantId: string; approvedQuantity: number }[],
  reviewNotes?: string,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(
    inventoryUrl(`/api/v1/stock-transfer-requests/${id}/approve`),
    { reviewNotes, items },
  );
  revalidatePath("/stock-requests");
}

export async function declineTransferRequest(
  id: string,
  reason?: string,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(
    inventoryUrl(`/api/v1/stock-transfer-requests/${id}/decline`),
    { reason },
  );
  revalidatePath("/stock-requests");
}

/** Requester withdraws their own PENDING request. */
export async function cancelTransferRequest(id: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(
    inventoryUrl(`/api/v1/stock-transfer-requests/${id}/cancel`),
    {},
  );
  revalidatePath("/stock-requests");
}
