"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";

// Profile management actions use the Auth Service (ApiClient with useAuthService=true)

export const changeEmail = async (
  userId: string,
  newEmail: string,
  currentPassword: string,
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient(true);
    await apiClient.post(`/auth/profile/email/change`, { userId, newEmail, currentPassword });
    return { responseType: "success", message: "Email change initiated. Check your new email for verification." };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to change email",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const confirmEmailChange = async (token: string): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient(true);
    await apiClient.post(`/auth/profile/email/change/confirm/token`, { token });
    return { responseType: "success", message: "Email changed successfully" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to confirm email change",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const confirmEmailChangeByCode = async (
  userId: string,
  code: string,
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient(true);
    await apiClient.post(`/auth/profile/email/change/confirm/code`, { userId, code });
    return { responseType: "success", message: "Email changed successfully" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to confirm email change",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const cancelEmailChange = async (userId: string): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient(true);
    await apiClient.delete(`/auth/profile/email/change/${userId}`);
    return { responseType: "success", message: "Email change cancelled" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to cancel email change",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const addPhone = async (
  userId: string,
  phoneNumber: string,
  region?: string,
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient(true);
    await apiClient.post(`/auth/profile/phone`, { userId, phoneNumber, region });
    return { responseType: "success", message: "Phone number added. Check your phone for verification." };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to add phone number",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const changePhone = async (
  userId: string,
  newPhoneNumber: string,
  region?: string,
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient(true);
    await apiClient.post(`/auth/profile/phone/change`, { userId, newPhoneNumber, region });
    return { responseType: "success", message: "Phone change initiated. Check your new phone for verification." };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to change phone number",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient(true);
    await apiClient.put(`/auth/profile/password`, { userId, currentPassword, newPassword });
    return { responseType: "success", message: "Password changed successfully" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to change password",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const setPassword = async (
  userId: string,
  newPassword: string,
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient(true);
    await apiClient.post(`/auth/profile/password`, { userId, newPassword });
    return { responseType: "success", message: "Password set successfully" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to set password",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const switchAccount = async (accountId: string): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient(true);
    const data = await apiClient.post(`/auth/switch-account`, { accountId });
    return { responseType: "success", message: "Account switched successfully", data: parseStringify(data) };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to switch account",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};
