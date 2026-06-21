"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import {
  SettloApiError,
  getUIErrorMessage,
} from "@/lib/settlo-api-error-handler";

// ── Auth Service verifiable phone number ────────────────────────────
// All endpoints are authenticated and target the AUTH service
// (`new ApiClient(true)` → AUTH_SERVICE_URL). This manages the AUTH
// phone — the one that gates phone-login / password-reset and will gate
// SMS MFA. The signed-in user is derived from the bearer token
// server-side, so no userId is sent.
//
// This is distinct from the Accounts-Service profile phone shown
// read-only in update_profile_form — reconciling the two is a separate
// follow-up.

/** Current AUTH phone state for the signed-in user. */
export interface PhoneStatus {
  /** E.164 number on file, or null/empty when none has been set. */
  phoneNumber: string | null;
  /** Whether the number above has been verified via SMS. */
  phoneVerified: boolean;
}

/**
 * The user's current AUTH phone and whether it's verified. Surfaces
 * failures as an error FormResponse so the caller can tell "no phone"
 * apart from "couldn't load".
 */
export const getPhoneStatus = async (): Promise<FormResponse<PhoneStatus>> => {
  try {
    const apiClient = new ApiClient(true);
    const data = await apiClient.get<PhoneStatus>(`/auth/profile/phone`);
    return {
      responseType: "success",
      message: "Phone status loaded",
      data: parseStringify(data),
    };
  } catch (error) {
    const message =
      error instanceof SettloApiError
        ? getUIErrorMessage(error.code, error.message, "Failed to load phone status")
        : "Failed to load phone status";
    return {
      responseType: "error",
      message,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

/**
 * Sets or replaces the user's AUTH phone number. Stored UNVERIFIED — no
 * SMS is sent here; call {@link requestPhoneCode} afterwards to start
 * verification. `region` is the ISO country code (e.g. "TZ") the number
 * was entered for.
 */
export const setPhone = async (
  phoneNumber: string,
  region?: string,
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient(true);
    await apiClient.post<void, { phoneNumber: string; region?: string }>(
      `/auth/profile/phone`,
      { phoneNumber, region },
    );
    return { responseType: "success", message: "Phone number saved" };
  } catch (error) {
    const message =
      error instanceof SettloApiError
        ? getUIErrorMessage(error.code, error.message, "Failed to save phone number")
        : "Failed to save phone number";
    return {
      responseType: "error",
      message,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

/**
 * Sends an SMS verification code to the user's current AUTH phone. The
 * backend enforces a cooldown between sends; when hit it returns a
 * "please wait…" message which we surface verbatim so the UI can show
 * it (e.g. on a too-soon "resend").
 */
export const requestPhoneCode = async (): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient(true);
    await apiClient.post<void, Record<string, never>>(
      `/auth/verify/phone/request`,
      {},
    );
    return {
      responseType: "success",
      message: "We sent a verification code to your phone",
    };
  } catch (error) {
    const message =
      error instanceof SettloApiError
        ? getUIErrorMessage(
            error.code,
            error.message,
            "Couldn't send the verification code. Please try again.",
          )
        : "Couldn't send the verification code. Please try again.";
    return {
      responseType: "error",
      message,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

/**
 * Confirms the SMS code and marks the AUTH phone as verified. A wrong or
 * expired code yields a 400/422 which we surface so the user can retry.
 */
export const confirmPhoneCode = async (
  code: string,
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient(true);
    await apiClient.post<void, { code: string }>(
      `/auth/verify/phone/code`,
      { code },
    );
    return { responseType: "success", message: "Phone number verified" };
  } catch (error) {
    const message =
      error instanceof SettloApiError
        ? getUIErrorMessage(error.code, error.message, "Invalid code. Please try again.")
        : "Invalid code. Please try again.";
    return {
      responseType: "error",
      message,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};
