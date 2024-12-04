'use server'
import ApiClient from "../settlo-api-client";
import { getCurrentLocation } from "./business/get-current-business";

export const fetchSummaries = async (startDate?: string, endDate?: string) => {
    try {
      const apiClient = new ApiClient(); 
      const location = await getCurrentLocation();
  
      console.log("Fetching summaries for dates:", startDate, endDate);
  
      const data = await apiClient.get(`/api/reports/${location?.id}/orders/summary`, {
        params: {
          startDate,
          endDate,
        },
      });
  
      console.log("Fetched summaries:", data);
      return data;
    } catch (error) {
      console.error("Error fetching summaries:", error);
      throw error;
    }
  };

  