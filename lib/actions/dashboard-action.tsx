"use server";

import ApiClient from "../settlo-api-client";
import { getCurrentLocation } from "./business/get-current-business";

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
