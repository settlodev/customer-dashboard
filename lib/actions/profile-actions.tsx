"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse, LoginResponse } from "@/types/types";
import {
  createAuthTokenFromLogin,
  deleteActiveBusinessCookie,
  deleteActiveLocationCookie,
} from "@/lib/auth-utils";
import { deleteActiveWarehouseCookie } from "./warehouse/current-warehouse-action";
import { revalidatePath } from "next/cache";

// Profile management actions use the Auth Service (ApiClient with useAuthService=true)

export const changeEmail = async (
  userId: string,
  newEmail: string,
  currentPassword: string,
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient(true);
    await apiClient.post(`/profile/email/change`, { userId, newEmail, currentPassword });
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
    await apiClient.post(`/profile/email/change/confirm/token`, { token });
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
    await apiClient.post(`/profile/email/change/confirm/code`, { userId, code });
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
    await apiClient.delete(`/profile/email/change/${userId}`);
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
    await apiClient.post(`/profile/phone`, { userId, phoneNumber, region });
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
    await apiClient.post(`/profile/phone/change`, { userId, newPhoneNumber, region });
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
    await apiClient.put(`/profile/password`, { userId, currentPassword, newPassword });
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
    await apiClient.post(`/profile/password`, { userId, newPassword });
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
    const loginData: LoginResponse = await apiClient.post(`/switch-account`, { accountId });

    // Clear current business/location context — the new account has different ones
    await deleteActiveBusinessCookie();
    await deleteActiveLocationCookie();
    await deleteActiveWarehouseCookie();

    // Fetch the new account's profile to populate auth token
    const ACCOUNTS_SERVICE_URL =
      process.env.ACCOUNTS_SERVICE_URL || process.env.SERVICE_URL || "";
    const WHITELABEL_CLIENT_ID =
      process.env.NEXT_PUBLIC_WHITELABEL_CLIENT_ID || "";

    let profileData: any = {};
    try {
      const profileResponse = await fetch(
        `${ACCOUNTS_SERVICE_URL}/api/v1/accounts/${loginData.accountId}`,
        {
          headers: {
            Authorization: `Bearer ${loginData.accessToken}`,
            "Content-Type": "application/json",
            ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
          },
        },
      );
      if (profileResponse.ok) {
        profileData = await profileResponse.json();
      }
    } catch {
      // Best-effort — proceed with tokens only
    }

    // Replace the auth token with the new account's tokens and profile
    await createAuthTokenFromLogin(loginData, {
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      phoneNumber: profileData.phoneNumber,
      pictureUrl: profileData.pictureUrl,
      isBusinessRegistrationComplete:
        profileData.isBusinessRegistrationComplete ?? false,
      isLocationRegistrationComplete:
        profileData.isLocationRegistrationComplete ?? false,
      countryId: profileData.countryId,
      countryCode: profileData.countryCode,
      theme: profileData.theme,
    });

    revalidatePath("/", "layout");

    return {
      responseType: "success",
      message: "Account switched successfully",
      data: parseStringify({ accountId: loginData.accountId }),
    };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to switch account",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};
