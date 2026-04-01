"use server";

import { revalidatePath } from "next/cache";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";

export interface WarehouseSettings {
  id: string;
  accountId: string;
  warehouseId: string;
  [key: string]: unknown;
}

export const getWarehouseSettings = async (warehouseId: string): Promise<WarehouseSettings> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/warehouses/${warehouseId}/settings`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const updateWarehouseSettings = async (
  warehouseId: string,
  settings: Partial<WarehouseSettings>,
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.put(`/api/v1/warehouses/${warehouseId}/settings`, settings);
    revalidatePath("/warehouse");
    return { responseType: "success", message: "Warehouse settings updated successfully" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to update warehouse settings",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const resetWarehouseSettings = async (warehouseId: string): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/warehouses/${warehouseId}/settings/reset`, {});
    revalidatePath("/warehouse");
    return { responseType: "success", message: "Warehouse settings reset to defaults" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to reset warehouse settings",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};
