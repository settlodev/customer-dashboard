"use server";

import { revalidatePath } from "next/cache";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";

export interface WarehouseClosureDate {
  id: string;
  warehouseId: string;
  date: string;
  reason?: string;
  recurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export const listWarehouseClosureDates = async (
  warehouseId: string,
  upcomingOnly?: boolean,
): Promise<WarehouseClosureDate[]> => {
  try {
    const apiClient = new ApiClient();
    const params = upcomingOnly !== undefined ? `?upcomingOnly=${upcomingOnly}` : "";
    const data = await apiClient.get(`/api/v1/warehouses/${warehouseId}/closure-dates${params}`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const createWarehouseClosureDate = async (
  warehouseId: string,
  data: { date: string; reason?: string; recurring?: boolean },
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/warehouses/${warehouseId}/closure-dates`, data);
    revalidatePath("/warehouse");
    return { responseType: "success", message: "Closure date created successfully" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to create closure date",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const updateWarehouseClosureDate = async (
  warehouseId: string,
  closureDateId: string,
  data: { date?: string; reason?: string; recurring?: boolean },
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.put(`/api/v1/warehouses/${warehouseId}/closure-dates/${closureDateId}`, data);
    revalidatePath("/warehouse");
    return { responseType: "success", message: "Closure date updated successfully" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to update closure date",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const deleteWarehouseClosureDate = async (
  warehouseId: string,
  closureDateId: string,
): Promise<void> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(`/api/v1/warehouses/${warehouseId}/closure-dates/${closureDateId}`);
    revalidatePath("/warehouse");
  } catch (error) {
    throw error;
  }
};
