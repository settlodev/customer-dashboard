"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";

export interface ReferralCode {
  code: string;
  referrerName?: string;
  referrerType?: string;
  createdAt?: string;
}

export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  pendingReferrals: number;
}

export interface ReferralValidation {
  valid: boolean;
  referralCode: string;
  referrerName: string;
  referrerType: string;
  message: string;
}

export const getMyReferralCode = async (): Promise<ReferralCode> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/referrals/my-code`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const generateReferralCode = async (): Promise<FormResponse<ReferralCode>> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.post(`/api/v1/referrals/generate`, {});
    return { responseType: "success", message: "Referral code generated", data: parseStringify(data) };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to generate referral code",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const getReferralStats = async (): Promise<ReferralStats> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/referrals/stats`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const validateReferralCode = async (code: string): Promise<ReferralValidation> => {
  try {
    const apiClient = new ApiClient();
    apiClient.isPlain = true;
    const data = await apiClient.get(`/api/v1/referrals/validate?code=${encodeURIComponent(code)}`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};
