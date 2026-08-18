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
