"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { FormResponse } from "@/types/types";
import type { StoreSettings } from "@/types/store/type";
import { getCurrentStore } from "@/lib/actions/store-actions";

const BASE = (storeId: string) => `/api/v1/stores/${storeId}/settings`;

/**
 * Store id to operate on. Callers in store mode omit it and we read the active
 * store from the `currentStore` cookie — the same destination the rest of the
 * dashboard is scoped to.
 */
async function resolveStoreId(storeId?: string): Promise<string | null> {
  if (storeId) return storeId;
  const store = await getCurrentStore();
  return store?.id ?? null;
}

export async function getStoreSettings(
  storeId?: string,
): Promise<StoreSettings | null> {
  const id = await resolveStoreId(storeId);
  if (!id) return null;
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(BASE(id));
    return parseStringify(data);
  } catch {
    return null;
  }
}

/**
 * Partial update — only the fields present on `input` are sent, so the backend
 * keeps everything else. Mirrors `updateLocationSettings`.
 */
export async function updateStoreSettings(
  input: Partial<StoreSettings>,
  storeId?: string,
): Promise<FormResponse<StoreSettings>> {
  const id = await resolveStoreId(storeId);
  if (!id) {
    return { responseType: "error", message: "No active store" };
  }

  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === undefined) continue;
    payload[k] = v;
  }
  if (Object.keys(payload).length === 0) {
    return { responseType: "error", message: "Nothing to save" };
  }

  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.put(BASE(id), payload)) as StoreSettings;
    revalidatePath("/settings");
    return {
      responseType: "success",
      message: "Settings saved",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to save settings";
    return {
      responseType: "error",
      message,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function resetStoreSettings(
  storeId?: string,
): Promise<FormResponse<StoreSettings>> {
  const id = await resolveStoreId(storeId);
  if (!id) {
    return { responseType: "error", message: "No active store" };
  }
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(`${BASE(id)}/reset`, {})) as StoreSettings;
    revalidatePath("/settings");
    return {
      responseType: "success",
      message: "Settings reset to defaults",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to reset settings";
    return {
      responseType: "error",
      message,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
