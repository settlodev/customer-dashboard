"use server";

import { getAuthToken, updateAuthToken } from "@/lib/auth-utils";
import { extractSubscriptionStatus } from "@/lib/jwt-utils";
import { parseStringify } from "@/lib/utils";
import { FormResponse, activeBusiness, TokenRefreshResponse } from "@/types/types";
import ApiClient from "@/lib/settlo-api-client";
import { cookies } from "next/headers";
import { Business } from "@/types/business/type";
import { Location } from "@/types/location/type";
import { revalidatePath } from "next/cache";

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || process.env.SERVICE_URL || "";

interface BusinessWithLocationsPayload {
  business: {
    name: string;
    description?: string;
    phoneNumber?: string;
    email?: string;
    website?: string;
    countryId?: string;
    businessTypeId?: string;
    region?: string;
    district?: string;
    ward?: string;
    address?: string;
    postalCode?: string;
    logoUrl?: string;
    baseCurrency?: string;
  };
  businessSettings?: Record<string, unknown>;
  locations: Array<{
    name: string;
    description?: string;
    phoneNumber?: string;
    email?: string;
    website?: string;
    region?: string;
    district?: string;
    ward?: string;
    address?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    businessTypeId?: string;
    settings?: {
      operatingHours?: Array<{
        dayOfWeek: string;
        openTime: string;
        closeTime: string;
        closed: boolean;
      }>;
      continuousOperation?: boolean;
      dailyCutoffTime?: string | null;
      closeGraceMinutes?: number;
    };
  }>;
}

// API response types from POST /api/v1/businesses/with-locations
interface ApiBusinessResponse {
  id: string;
  accountId: string;
  identifier?: string;
  name: string;
  description?: string;
  phoneNumber?: string;
  email?: string;
  website?: string;
  active: boolean;
  countryId?: string;
  businessTypeId?: string;
  businessTypeName?: string;
  region?: string;
  district?: string;
  ward?: string;
  address?: string;
  postalCode?: string;
  logoUrl?: string;
  baseCurrency?: string;
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiLocationResponse {
  id: string;
  accountId: string;
  businessId: string;
  businessName: string;
  identifier?: string;
  name: string;
  description?: string;
  phoneNumber?: string;
  email?: string;
  website?: string;
  active: boolean;
  countryId?: string;
  region?: string;
  district?: string;
  ward?: string;
  address?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiBusinessWithLocationsResponse {
  business: ApiBusinessResponse;
  locations: ApiLocationResponse[];
}

/**
 * Maps the new API business response to the existing Business type
 * used throughout the app.
 */
function mapApiBusinessToExisting(
  apiBusiness: ApiBusinessResponse,
): Business {
  return {
    id: apiBusiness.id,
    accountId: apiBusiness.accountId,
    identifier: apiBusiness.identifier || apiBusiness.slug || "",
    name: apiBusiness.name,
    description: apiBusiness.description || "",
    phoneNumber: apiBusiness.phoneNumber || "",
    email: apiBusiness.email || "",
    website: apiBusiness.website || "",
    active: apiBusiness.active,
    countryId: apiBusiness.countryId || "",
    businessTypeId: apiBusiness.businessTypeId || "",
    businessTypeName: apiBusiness.businessTypeName || "",
    region: apiBusiness.region || "",
    district: apiBusiness.district || "",
    ward: apiBusiness.ward || "",
    address: apiBusiness.address || "",
    postalCode: apiBusiness.postalCode || "",
    logoUrl: apiBusiness.logoUrl || "",
    baseCurrency: apiBusiness.baseCurrency || "",
    createdAt: apiBusiness.createdAt || "",
    updatedAt: apiBusiness.updatedAt || "",
  };
}

/**
 * Maps the new API location response to the existing Location type
 * used throughout the app.
 */
function mapApiLocationToExisting(
  apiLocation: ApiLocationResponse,
): Location {
  return {
    id: apiLocation.id,
    accountId: apiLocation.accountId,
    businessId: apiLocation.businessId,
    businessName: apiLocation.businessName,
    identifier: apiLocation.identifier || apiLocation.id,
    name: apiLocation.name,
    description: apiLocation.description || "",
    phoneNumber: apiLocation.phoneNumber || "",
    email: apiLocation.email || "",
    active: apiLocation.active,
    countryId: apiLocation.countryId || "",
    region: apiLocation.region || "",
    district: apiLocation.district || "",
    ward: apiLocation.ward || "",
    address: apiLocation.address || "",
    postalCode: apiLocation.postalCode || "",
    latitude: apiLocation.latitude ?? null,
    longitude: apiLocation.longitude ?? null,
    timezone: apiLocation.timezone || "",
    website: apiLocation.website || "",
    createdAt: apiLocation.createdAt || "",
    updatedAt: apiLocation.updatedAt || "",
  };
}

export interface OperatingHoursEntry {
  dayOfWeek: string;
  openTime: string;
  closeTime: string;
  closed: boolean;
}

export interface LocationInput {
  name: string;
  description?: string;
  phoneNumber?: string;
  email?: string;
  website?: string;
  region?: string;
  district?: string;
  ward?: string;
  address?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  countryId?: string;
  businessTypeId?: string;
  operatingHours?: OperatingHoursEntry[];
  continuousOperation?: boolean;
  dailyCutoffTime?: string | null;
  closeGraceMinutes?: number;
}

export const createBusinessWithLocations = async (data: {
  businessName: string;
  description?: string;
  phoneNumber?: string;
  email?: string;
  website?: string;
  businessTypeId?: string;
  countryId?: string;
  region?: string;
  district?: string;
  ward?: string;
  address?: string;
  postalCode?: string;
  logoUrl?: string;
  baseCurrency?: string;
  locations: LocationInput[];
}): Promise<FormResponse> => {
  try {
    const authToken = await getAuthToken();
    if (!authToken) {
      return parseStringify({
        responseType: "error",
        message: "Session expired, please login to proceed.",
        error: new Error("No auth token"),
      });
    }

    const payload: BusinessWithLocationsPayload = {
      business: {
        name: data.businessName,
        description: data.description,
        phoneNumber: data.phoneNumber,
        email: data.email,
        website: data.website,
        countryId: data.countryId || authToken.countryId,
        businessTypeId: data.businessTypeId,
        region: data.region,
        district: data.district,
        ward: data.ward,
        address: data.address,
        postalCode: data.postalCode,
        logoUrl: data.logoUrl,
        baseCurrency: data.baseCurrency,
      },
      locations: data.locations.map((loc) => {
        // Build settings: prefer continuousOperation when true (omit operatingHours);
        // otherwise include operatingHours (omit continuousOperation/dailyCutoffTime).
        const settings: NonNullable<BusinessWithLocationsPayload["locations"][number]["settings"]> = {};
        if (loc.continuousOperation) {
          settings.continuousOperation = true;
          if (loc.dailyCutoffTime) settings.dailyCutoffTime = loc.dailyCutoffTime;
        } else {
          if (loc.operatingHours?.length) settings.operatingHours = loc.operatingHours;
          if (typeof loc.closeGraceMinutes === "number") {
            settings.closeGraceMinutes = loc.closeGraceMinutes;
          }
        }
        const hasSettings = Object.keys(settings).length > 0;

        return {
          name: loc.name,
          description: loc.description,
          phoneNumber: loc.phoneNumber || data.phoneNumber,
          email: loc.email || data.email,
          website: loc.website || data.website,
          region: loc.region,
          district: loc.district,
          ward: loc.ward,
          address: loc.address,
          postalCode: loc.postalCode,
          latitude: loc.latitude,
          longitude: loc.longitude,
          timezone: loc.timezone,
          businessTypeId: loc.businessTypeId || data.businessTypeId,
          settings: hasSettings ? settings : undefined,
        };
      }),
    };

    const apiClient = new ApiClient();
    const apiResponse = await apiClient.post<
      ApiBusinessWithLocationsResponse,
      BusinessWithLocationsPayload
    >("/api/v1/businesses/with-locations", payload);

    if (apiResponse) {
      // Update auth token flags
      const updatedToken = {
        ...authToken,
        isBusinessRegistrationComplete: true,
        isLocationRegistrationComplete: true,
      };
      await updateAuthToken(updatedToken);

      // Map API response to existing types
      const business = mapApiBusinessToExisting(apiResponse.business);
      const locations = (apiResponse.locations || []).map(mapApiLocationToExisting);

      // Set active business cookie (inline, without redirect)
      const cookieStore = await cookies();
      const isProduction = process.env.NODE_ENV === "production";

      const minimalBusiness = {
        id: business.id,
        identifier: business.identifier,
        name: business.name,
        businessTypeId: business.businessTypeId,
        businessTypeName: business.businessTypeName,
        logoUrl: business.logoUrl || null,
        active: business.active,
        accountId: business.accountId,
        countryId: business.countryId,
      };

      cookieStore.set({
        name: "currentBusiness",
        value: JSON.stringify(minimalBusiness),
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
      });

      const businessActive: activeBusiness = {
        businessId: business.id as `${string}-${string}-${string}-${string}-${string}`,
      };
      cookieStore.set({
        name: "activeBusiness",
        value: JSON.stringify(businessActive),
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
      });

      // Set active location cookie (without calling switchLocation which redirects)
      if (locations.length > 0) {
        cookieStore.set({
          name: "currentLocation",
          value: JSON.stringify(locations[0]),
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? "strict" : "lax",
        });
      }

      // Refresh the access token so it picks up the new business/location
      // claims (business_id, assigned_to_id, updated permissions).
      try {
        const whitelabelClientId = process.env.NEXT_PUBLIC_WHITELABEL_CLIENT_ID;
        const refreshResponse = await fetch(
          `${AUTH_SERVICE_URL}/auth/token-refresh`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(whitelabelClientId ? { "X-Client-Id": whitelabelClientId } : {}),
            },
            body: JSON.stringify({ refreshToken: authToken.refreshToken }),
          },
        );

        if (refreshResponse.ok) {
          const refreshData: TokenRefreshResponse = await refreshResponse.json();
          await updateAuthToken({
            ...authToken,
            accessToken: refreshData.accessToken,
            refreshToken: refreshData.refreshToken || authToken.refreshToken,
            isBusinessRegistrationComplete: true,
            isLocationRegistrationComplete: true,
            subscriptionStatus: extractSubscriptionStatus(refreshData.accessToken),
          });
          console.log("[BUSINESS] Access token refreshed with new business/location claims");
        }
      } catch {
        // Non-critical — the old token still works, just missing the new claims
        console.warn("[BUSINESS] Token refresh after business creation failed (non-critical)");
      }

      revalidatePath("/", "layout");

      return parseStringify({
        responseType: "success",
        message: "Business and location created successfully!",
        data: { business, locations },
      });
    }

    return parseStringify({
      responseType: "error",
      message: "Unexpected response from server.",
      error: new Error("Empty response"),
    });
  } catch (error: any) {
    // Re-throw Next.js redirect errors
    if (
      error instanceof Error &&
      "digest" in error &&
      typeof (error as any).digest === "string" &&
      (error as any).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    return parseStringify({
      responseType: "error",
      message:
        error.message ||
        "Something went wrong while processing your request, please try again.",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
};

