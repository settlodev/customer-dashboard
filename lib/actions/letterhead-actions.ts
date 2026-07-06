"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { inventoryUrl } from "./inventory-client";
import { getBusinessSettings } from "./business-settings-actions";
import {
  getCurrentBusiness,
  getCurrentLocation,
} from "./business/get-current-business";
import type { LocationLetterhead } from "@/types/letterhead/type";

/**
 * Letterhead for the ACTIVE destination (X-Location-Id header), for
 * authenticated document rendering — e.g. the GRN print view. Primary
 * source is the Inventory Service's letterhead endpoint (same
 * LocationReference data the public share pages embed, so authenticated
 * prints match shared documents exactly). When that endpoint has nothing
 * for the destination (or is not deployed yet), falls back to composing
 * an equivalent block from the active location/business — mirroring the
 * producer's location-first / business-fallback precedence.
 */
export async function getLetterhead(): Promise<LocationLetterhead | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get<LocationLetterhead>(
      inventoryUrl("/api/v1/letterhead"),
    );
    if (data) return parseStringify(data);
  } catch {
    // Fall through to the composed fallback.
  }
  return composeLetterheadFallback();
}

async function composeLetterheadFallback(): Promise<LocationLetterhead | null> {
  try {
    const [location, business] = await Promise.all([
      getCurrentLocation(),
      getCurrentBusiness(),
    ]);
    if (!location && !business) return null;

    // Tax IDs are business-level; tolerate a missing settings row.
    const businessId = location?.businessId ?? business?.id ?? null;
    let tin: string | null = null;
    let vrn: string | null = null;
    if (businessId) {
      try {
        const settings = await getBusinessSettings(businessId);
        tin = settings?.taxIdentificationNumber ?? null;
        vrn = settings?.vatRegistrationNumber ?? null;
      } catch {
        // Letterhead stays usable without tax IDs.
      }
    }

    return {
      locationId: location?.id ?? null,
      businessId,
      letterhead: {
        businessName: location?.businessName ?? business?.name ?? null,
        locationName: location?.name ?? null,
        addressLine: location?.address ?? business?.address ?? null,
        street: null,
        ward: location?.ward ?? business?.ward ?? null,
        district: location?.district ?? business?.district ?? null,
        city: null,
        region: location?.region ?? business?.region ?? null,
        postalCode: location?.postalCode ?? business?.postalCode ?? null,
        countryName: null,
        countryCode: null,
        phone: location?.phoneNumber ?? business?.phoneNumber ?? null,
        email: location?.email ?? business?.email ?? null,
        website: location?.website ?? business?.website ?? null,
        logoUrl: business?.logoUrl ?? null,
      },
      taxIds: {
        tin,
        vrn,
        urn: null,
        businessLicenseNumber: null,
        companyRegistrationNumber: null,
        efdSerialNumber: null,
        efdStatus: null,
      },
      brand: null,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    return null;
  }
}
