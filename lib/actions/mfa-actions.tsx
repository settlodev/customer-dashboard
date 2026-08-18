"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import {
  SettloApiError,
  getUIErrorMessage,
} from "@/lib/settlo-api-error-handler";

// ── Auth Service MFA (TOTP) enrollment ──────────────────────────────
// All endpoints are authenticated and target the AUTH service
// (`new ApiClient(true)` → AUTH_SERVICE_URL). Paths mirror the
// controller's @RequestMapping("/auth/mfa"). The signed-in user is
// derived from the bearer token server-side, so no userId is sent.

/** Current MFA enrollment state for the signed-in user. */
export interface MfaStatus {
  enabled: boolean;
}

/** Pending TOTP secret + provisioning URI returned by setup. */
export interface MfaSetup {
  /** otpauth:// URI to render as a QR code for authenticator apps. */
  otpAuthUri: string;
  /** Base32 secret for manual entry when a QR can't be scanned. */
  secret: string;
}

/** Recovery codes shown exactly once after enabling MFA. */
export interface MfaEnableResult {
  recoveryCodes: string[];
}

/**
 * Whether 2FA is currently enabled. Surfaces failures as an error
 * FormResponse so the caller can decide between "off" and "couldn't load".
 */
export const getMfaStatus = async (): Promise<FormResponse<MfaStatus>> => {
  try {
    const apiClient = new ApiClient(true);
    const data = await apiClient.get<MfaStatus>(`/auth/mfa/status`);
    return {
      responseType: "success",
      message: "MFA status loaded",
      data: parseStringify(data),
    };
  } catch (error) {
    const message =
      error instanceof SettloApiError
        ? getUIErrorMessage(error.code, error.message, "Failed to load 2FA status")
        : "Failed to load 2FA status";
    return {
      responseType: "error",
      message,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

/**
 * Begins enrollment: generates a pending secret (not yet enabled) and
 * returns the provisioning URI to render as a QR code plus the raw secret
 * for manual entry.
 */
export const setupMfa = async (): Promise<FormResponse<MfaSetup>> => {
  try {
    const apiClient = new ApiClient(true);
    const data = await apiClient.post<MfaSetup, Record<string, never>>(
      `/auth/mfa/setup`,
      {},
    );
    return {
      responseType: "success",
      message: "Scan the QR code with your authenticator app",
      data: parseStringify(data),
    };
  } catch (error) {
    const message =
      error instanceof SettloApiError
        ? getUIErrorMessage(error.code, error.message, "Failed to start 2FA setup")
        : "Failed to start 2FA setup";
    return {
      responseType: "error",
      message,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

/**
 * Confirms enrollment with a 6-digit code from the authenticator app.
 * On success returns the recovery codes (shown once); a bad code yields a
 * 400 which we surface as an error so the user can retry.
 */
export const enableMfa = async (
  code: string,
): Promise<FormResponse<MfaEnableResult>> => {
  try {
    const apiClient = new ApiClient(true);
    const data = await apiClient.post<MfaEnableResult, { code: string }>(
      `/auth/mfa/enable`,
      { code },
    );
    return {
      responseType: "success",
      message: "Two-factor authentication enabled",
      data: parseStringify(data),
    };
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

/**
 * Disables MFA. The code may be a current TOTP or a recovery code.
 */
export const disableMfa = async (code: string): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient(true);
    await apiClient.post<void, { code: string }>(`/auth/mfa/disable`, { code });
    return {
      responseType: "success",
      message: "Two-factor authentication disabled",
    };
  } catch (error) {
    const message =
      error instanceof SettloApiError
        ? getUIErrorMessage(error.code, error.message, "Failed to disable 2FA")
        : "Failed to disable 2FA";
    return {
      responseType: "error",
      message,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};
