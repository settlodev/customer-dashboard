"use server";

import { revalidatePath } from "next/cache";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";

export interface ClosureDate {
  id: string;
  locationId: string;
  date: string;
  reason?: string;
  recurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export const listClosureDates = async (
  locationId: string,
  upcomingOnly?: boolean,
): Promise<ClosureDate[]> => {
  try {
    const apiClient = new ApiClient();
    const params = upcomingOnly !== undefined ? `?upcomingOnly=${upcomingOnly}` : "";
    const data = await apiClient.get(`/api/v1/locations/${locationId}/closure-dates${params}`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const getClosureDate = async (
  locationId: string,
  closureDateId: string,
): Promise<ClosureDate> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/locations/${locationId}/closure-dates/${closureDateId}`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const createClosureDate = async (
  locationId: string,
  data: { date: string; reason?: string; recurring?: boolean },
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/locations/${locationId}/closure-dates`, data);
    revalidatePath("/settings");
    return { responseType: "success", message: "Closure date created successfully" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to create closure date",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const updateClosureDate = async (
  locationId: string,
  closureDateId: string,
  data: { date?: string; reason?: string; recurring?: boolean },
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.put(`/api/v1/locations/${locationId}/closure-dates/${closureDateId}`, data);
    revalidatePath("/settings");
    return { responseType: "success", message: "Closure date updated successfully" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to update closure date",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const deleteClosureDate = async (
  locationId: string,
  closureDateId: string,
): Promise<void> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(`/api/v1/locations/${locationId}/closure-dates/${closureDateId}`);
    revalidatePath("/settings");
  } catch (error) {
    throw error;
  }
};
