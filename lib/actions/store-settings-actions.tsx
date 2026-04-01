"use server";

import { revalidatePath } from "next/cache";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import { StoreSettings } from "@/types/store/type";

export const getStoreSettings = async (storeId: string): Promise<StoreSettings> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/stores/${storeId}/settings`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const updateStoreSettings = async (
  storeId: string,
  settings: Partial<StoreSettings>,
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.put(`/api/v1/stores/${storeId}/settings`, settings);
    revalidatePath("/stores");
    return { responseType: "success", message: "Store settings updated successfully" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to update store settings",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const resetStoreSettings = async (storeId: string): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/stores/${storeId}/settings/reset`, {});
    revalidatePath("/stores");
    return { responseType: "success", message: "Store settings reset to defaults" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to reset store settings",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};
