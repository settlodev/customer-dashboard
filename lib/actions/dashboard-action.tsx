'use server'
import { console } from "inspector";
import ApiClient from "../settlo-api-client";
import { getCurrentLocation } from "./business/get-current-business";

export const fetchSummaries = async (startDate?: string, endDate?: string) => {
    try {
      const apiClient = new ApiClient(); 
      const location = await getCurrentLocation();
    
      const data = await apiClient.get(`/api/reports/${location?.id}/orders/summary`, {
        params: {
          startDate,
          endDate,
          orderType:'OPEN_AND_CLOSED'
        },
      });  

      // console.log("Summaries are as follow:", data);
      return data;
    } catch (error) {
      console.error("Error fetching summaries:", error );
      throw error;
    }
  };

  