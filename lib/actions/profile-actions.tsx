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

export const cancelEmailChange = async (_userId: string): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient(true);
    await apiClient.delete(`/auth/profile/email/change`);
    return { responseType: "success", message: "Email change cancelled" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to cancel email change",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

// NOTE: The AUTH verifiable phone (set + SMS verify) now lives in a
// cohesive module — see lib/actions/phone-actions.tsx (submitPhone /
// confirmPhoneCode / getPhoneStatus), surfaced by the profile PhoneCard.
// It uses the authenticated change flow (POST /auth/profile/phone/change
// then /auth/profile/phone/change/confirm/code), where the bearer token
// identifies the user. The previous dead addPhone/changePhone helpers
// here posted an incorrect shape (userId in body) and were never wired
// up, so they were removed in favour of that module.

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

    // Replace the auth token with the new account's tokens and profile.
    // Identity fields (name/phone/picture/theme) come from the EXISTING token —
    // the logged-in user's identity must not change across account switches.
    // Only account-context fields (registration flags, country) change.
    const existing = await getAuthToken();
    await createAuthTokenFromLogin(loginData, {
      firstName: existing?.firstName || profileData.firstName,
      lastName: existing?.lastName || profileData.lastName,
      phoneNumber: existing?.phoneNumber || profileData.phoneNumber,
      pictureUrl: existing?.pictureUrl ?? profileData.pictureUrl,
      theme: existing?.theme ?? profileData.theme,
      // account-context (the NEW account's) — these legitimately change on switch:
      isBusinessRegistrationComplete:
        profileData.isBusinessRegistrationComplete ?? false,
      isLocationRegistrationComplete:
        profileData.isLocationRegistrationComplete ?? false,
      countryId: profileData.countryId,
      countryCode: profileData.countryCode,
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
