"use server";

import ApiClient from "@/lib/settlo-api-client";
import { SettloApiError } from "@/lib/settlo-api-error-handler";
import { parseStringify } from "@/lib/utils";

/** Mirrors the Accounts Service LocationVfdRegistrationResponse. */
export interface VfdRegistration {
  id: string;
  isActive: boolean | null;
  verified: boolean | null;
  externalStatus: string | null;
  externalStatusMessage: string | null;
  uin: string | null;
  tin: number | null;
  taxOffice: string | null;
  vrn: string | null;
  tradingName: string | null;
  businessName: string | null;
  isVatRegistered: boolean | null;
}

/**
 * A location's VFD (TRA fiscal device) registration — gates the "Print
 * VFD" action on the order-detail page (`verified === true`). A 404 means
 * the location has never been onboarded for fiscal printing, which is the
 * default state for most locations, so it resolves to `{ data: null }`
 * rather than an error.
 */
export const getLocationVfdRegistration = async (
  locationId: string,
): Promise<{ data: VfdRegistration | null } | { error: string }> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get<VfdRegistration>(
      `/api/v1/locations/vfd-registrations/${locationId}`,
    );
    return { data: parseStringify(data) };
  } catch (error: unknown) {
    if (error instanceof SettloApiError && error.status === 404) {
      return { data: null };
    }
    // Any other failure also resolves to a hidden button (fail-closed is
    // deliberate for a fiscal gate — never show "Print VFD" on a guess),
    // but log it so a transient/misconfigured lookup doesn't go unnoticed.
    console.error("[vfd] registration lookup failed:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to load the location's VFD registration",
    };
  }
};

export interface OnboardLocationVfdPayload {
  locationId: string;
  tinNumber: string;
  businessName: string;
  emailAddress: string;
  phoneNumber: string;
}

/**
 * Registers a location with TRA through the DIRM virtual fiscal device
 * service. Creates the Accounts Service mirror row synchronously; the
 * actual DIRM registration happens async over Kafka, so `verified` stays
 * `false` until DIRM activates the account (poll via
 * `checkLocationVfdStatus`).
 */
export const onboardLocationVfd = async (
  payload: OnboardLocationVfdPayload,
): Promise<{ data: true } | { error: string }> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post<void, OnboardLocationVfdPayload & { provider: "DIRM_VFD" }>(
      `/api/v1/locations/vfd-registrations`,
      { ...payload, provider: "DIRM_VFD" },
    );
    return { data: true };
  } catch (error: unknown) {
    console.error("[vfd] onboarding failed:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to submit the VFD registration",
    };
  }
};

export interface VfdStatusCheck {
  isOnboarded: boolean;
  isVerified: boolean;
}

/**
 * Asks the Accounting service to re-authenticate this location's DIRM
 * account. For an unverified account this is the trigger that flips
 * verification server-side once DIRM has activated it (the Accounts
 * mirror then updates over Kafka, usually within seconds). While DIRM/TRA
 * activation is still pending, this resolves to `{ data: { isVerified:
 * false } }` — a normal outcome, not a failure. `error` is reserved for
 * actual request failures (network, auth, unexpected 5xx).
 */
export const checkLocationVfdStatus = async (
  locationId: string,
): Promise<{ data: VfdStatusCheck } | { error: string }> => {
  try {
    const apiClient = new ApiClient("accounting");
    const data = await apiClient.get<VfdStatusCheck>(
      `/api/vfd/${locationId}/status`,
    );
    return { data: parseStringify(data) };
  } catch (error: unknown) {
    console.error("[vfd] status check failed:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to check the location's VFD status",
    };
  }
};
