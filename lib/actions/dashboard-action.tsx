"use server";

import ApiClient from "../settlo-api-client";
import { getCurrentLocation } from "./business/get-current-business";
import { ProductSummaryResponse } from "@/types/product/product-summary";

export const getLocationId = async (): Promise<string | undefined> => {
  const location = await getCurrentLocation();
  return location?.id;
};

export const fetchSummaries = async (startDate: string, endDate?: string) => {
  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();

    return await apiClient.get(`/reports/api/v1/reports/summary/location`, {
      params: {
        locationId: location?.id,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error("Error fetching summaries:", error);
    throw error;
  }
};

export const fetchStaffSummary = async (
  staffId: string,
  startDate: string,
  endDate?: string,
) => {
  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();

    return await apiClient.get(`/reports/api/v1/reports/summary/staff`, {
      params: {
        locationId: location?.id,
        staffId,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error("Error fetching staff summary:", error);
    throw error;
  }
};

export const fetchProductSummary = async (
  productId: string,
  startDate: string,
  endDate?: string,
): Promise<ProductSummaryResponse> => {
  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();

    return await apiClient.get(`/reports/api/v1/reports/summary/product`, {
      params: {
        locationId: location?.id,
        productId,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error("Error fetching product summary:", error);
    throw error;
  }
};
