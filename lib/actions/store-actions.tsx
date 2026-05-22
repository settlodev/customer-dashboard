"use server";

import { cache } from "react";
import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import * as z from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { SettloApiError } from "@/lib/settlo-api-error-handler";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { Store } from "@/types/store/type";
import { StoreSchema } from "@/types/store/schema";
import { LAYOUT_TAGS } from "@/lib/cache-tags";

/** Reads the active store from the `currentStore` cookie, if any. */
export const getCurrentStore = async (): Promise<Store | undefined> => {
  const cookieStore = await cookies();
  const raw = cookieStore.get("currentStore")?.value;
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as Store;
  } catch {
    return undefined;
  }
};

// Per-request memoisation only — `unstable_cache` can't be used here
// because `ApiClient` reads cookies inside its interceptors, which
// Next.js disallows inside a cache scope.
const _fetchAllStores = cache(
  async (
    businessId?: string,
    locationId?: string,
  ): Promise<Store[]> => {
    const apiClient = new ApiClient();
    const params = new URLSearchParams();
    if (businessId) params.append("businessId", businessId);
    if (locationId) params.append("locationId", locationId);
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await apiClient.get<Store[] | null>(`/api/v1/stores${query}`);
    return parseStringify(data ?? []);
  },
);

export const fetchAllStores = async (
  businessId?: string,
  locationId?: string,
): Promise<Store[]> => {
  return _fetchAllStores(businessId, locationId);
};

export const searchStores = async (
  q: string,
  page: number,
  pageLimit: number,
  businessId?: string,
  locationId?: string,
): Promise<ApiResponse<Store>> => {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams();
    if (q) params.append("search", q);
    params.append("page", String(page ? page - 1 : 0));
    params.append("size", String(pageLimit || 10));
    params.append("sort", "name,asc");
    if (businessId) params.append("businessId", businessId);
    if (locationId) params.append("locationId", locationId);
    const data = await apiClient.get(`/api/v1/stores?${params.toString()}`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const getStore = async (id: string): Promise<Store> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/stores/${id}`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const createStore = async (
  store: z.infer<typeof StoreSchema>,
): Promise<FormResponse> => {
  const validatedData = StoreSchema.safeParse(store);
  if (!validatedData.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill in all required fields",
      error: new Error(validatedData.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();
    const response = await apiClient.post(`/api/v1/stores`, validatedData.data);
    revalidatePath("/stores");
    revalidateTag(LAYOUT_TAGS.stores);
    return { responseType: "success", message: "Store created successfully", data: response };
  } catch (error) {
    if (error instanceof SettloApiError) {
      return {
        responseType: "error",
        message: error.message || "Failed to create store",
        errorCode: error.code,
        metadata: { ...(error.metadata ?? {}), status: error.status },
        error,
      };
    }
    return {
      responseType: "error",
      message: "Failed to create store",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const updateStore = async (
  id: string,
  store: z.infer<typeof StoreSchema>,
): Promise<FormResponse> => {
  const validatedData = StoreSchema.safeParse(store);
  if (!validatedData.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill in all required fields",
      error: new Error(validatedData.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.put(`/api/v1/stores/${id}`, validatedData.data);
    revalidatePath("/stores");
    revalidateTag(LAYOUT_TAGS.stores);
    return { responseType: "success", message: "Store updated successfully" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to update store",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const deleteStore = async (id: string): Promise<void> => {
  if (!id) throw new Error("Store ID is required");
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(`/api/v1/stores/${id}`);
    revalidatePath("/stores");
    revalidateTag(LAYOUT_TAGS.stores);
  } catch (error) {
    throw error;
  }
};

export const deactivateStore = async (id: string): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/stores/${id}/deactivate`, {});
    revalidatePath("/stores");
    revalidateTag(LAYOUT_TAGS.stores);
    return { responseType: "success", message: "Store deactivated successfully" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to deactivate store",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const reactivateStore = async (id: string): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/stores/${id}/reactivate`, {});
    revalidatePath("/stores");
    revalidateTag(LAYOUT_TAGS.stores);
    return { responseType: "success", message: "Store reactivated successfully" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to reactivate store",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const getStoreCount = async (businessId?: string): Promise<{ total: number; active: number; inactive: number }> => {
  try {
    const apiClient = new ApiClient();
    const params = businessId ? `?businessId=${businessId}` : "";
    const data = await apiClient.get(`/api/v1/stores/count${params}`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};
