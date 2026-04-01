"use server";

import { revalidatePath } from "next/cache";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";

export interface LoyaltyPointsBalance {
  customerId: string;
  balance: number;
  totalEarned: number;
  totalRedeemed: number;
}

export const getCustomerLoyaltyPoints = async (customerId: string): Promise<LoyaltyPointsBalance> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/loyalty-points/customers/${customerId}`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const awardLoyaltyPoints = async (data: {
  customerId: string;
  points: number;
  reason?: string;
}): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/loyalty-points/award`, data);
    revalidatePath("/customers");
    return { responseType: "success", message: "Points awarded successfully" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to award points",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const redeemLoyaltyPoints = async (
  customerId: string,
  data: { points: number; reason?: string },
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/loyalty-points/customers/${customerId}/redeem`, data);
    revalidatePath("/customers");
    return { responseType: "success", message: "Points redeemed successfully" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to redeem points",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};
