"use server";

import ApiClient from "../settlo-api-client";
import { getCurrentLocation } from "./business/get-current-business";
import { ProductSummaryResponse } from "@/types/product/product-summary";

export const getLocationId = async (): Promise<string | undefined> => {
  const location = await getCurrentLocation();
  return location?.id;
};

export const fetchOverview = async (
  startDate: string,
  endDate?: string,
  staffId?: string,
) => {
  try {
    const apiClient = new ApiClient("reports");
    const location = await getCurrentLocation();

    return await apiClient.get(`/api/v2/analytics/overview`, {
      params: {
        locationId: location?.id,
        startDate,
        endDate,
        ...(staffId && { staffId }),
      },
    });
  } catch (error) {
    console.error("Error fetching overview:", error);
    throw error;
  }
};

export const fetchOverviewByFilter = async (
  filter: string,
  customStart?: string | null,
  customEnd?: string | null,
  staffId?: string,
) => {
  try {
    const apiClient = new ApiClient("reports");
    const location = await getCurrentLocation();

    return await apiClient.get(`/api/v2/analytics/overview/by-filter`, {
      params: {
        locationId: location?.id,
        filter,
        ...(customStart && { customStart }),
        ...(customEnd && { customEnd }),
        ...(staffId && { staffId }),
      },
    });
  } catch (error) {
    console.error("Error fetching overview by filter:", error);
    throw error;
  }
};

export const fetchProductSummary = async (
  productId: string,
  startDate: string,
  endDate?: string,
): Promise<ProductSummaryResponse> => {
  try {
    const apiClient = new ApiClient("reports");
    const location = await getCurrentLocation();

    return await apiClient.get(`/api/v2/analytics/summary/product`, {
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
