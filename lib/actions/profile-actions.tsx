"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse, LoginResponse } from "@/types/types";
import {
  createAuthTokenFromLogin,
  deleteActiveBusinessCookie,
  getAuthToken,
} from "@/lib/auth-utils";
import { clearDestination } from "./destination";
import { revalidatePath } from "next/cache";

/** One account the current user can switch into — from GET /api/v1/me/accounts. */
export interface MeAccount {
  id: string;
  name: string;
  identifier: string;
  email: string;
  active: boolean;
  owner: boolean;
}

/**
 * Accounts the current user belongs to (owned + invited) plus the account
 * their token is currently scoped to — powers the account switcher. Returns an
 * empty list on failure so the switcher simply hides itself.
 */
export const getMyAccountsContext = async (): Promise<{
  accounts: MeAccount[];
  currentAccountId: string | null;
}> => {
  try {
    const apiClient = new ApiClient(); // accounts service
    const [data, token] = await Promise.all([
      apiClient.get<MeAccount[] | null>(`/api/v1/me/accounts`),
      getAuthToken(),
    ]);
    return {
      accounts: parseStringify(data ?? []),
      currentAccountId: token?.accountId ?? null,
    };
  } catch {
    return { accounts: [], currentAccountId: null };
  }
};

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
    const loginData: LoginResponse = await apiClient.post(`/auth/switch-account`, { accountId });

    // Clear current business/destination context — the new account has its own
    await deleteActiveBusinessCookie();
    await clearDestination();

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
    console.error("[switchAccount] failed:", error);
    return {
      responseType: "error",
      message: "Failed to switch account",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};
