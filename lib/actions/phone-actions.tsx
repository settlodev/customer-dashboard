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
 * Sets (or replaces) the user's AUTH phone number AND sends the SMS
 * verification code in a single call — the authenticated "change" flow.
 * The signed-in user is taken from the bearer token, so only the new
 * number is sent. The number is stored PENDING and verified once
 * {@link confirmPhoneCode} succeeds; this same path handles a first add.
 *
 * `region` is the ISO country code (e.g. "TZ") the number was entered
 * for. A "resend" is just this call again with the same number.
 *
 * The backend enforces a cooldown between sends; when hit it returns a
 * RATE_LIMITED "please wait…" message which we surface verbatim so the
 * UI can show it (e.g. on a too-soon resend).
 */
export const submitPhone = async (
  phoneNumber: string,
  region?: string,
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient(true);
    await apiClient.post<void, { newPhoneNumber: string; region?: string }>(
      `/auth/profile/phone/change`,
      { newPhoneNumber: phoneNumber, region },
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
 * Confirms the SMS code and marks the AUTH phone as verified. The JWT
 * identifies the user, so only the code is sent. This path carries the
 * brute-force lockout: a wrong/expired code yields a 400/422 (or a
 * lockout message) which we surface so the user can retry.
 */
export const confirmPhoneCode = async (
  code: string,
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient(true);
    await apiClient.post<void, { code: string }>(
      `/auth/profile/phone/change/confirm/code`,
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
