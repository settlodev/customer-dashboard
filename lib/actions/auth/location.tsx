"use server";

import { getAuthToken, updateAuthToken } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import { FormResponse, activeBusiness, TokenRefreshResponse } from "@/types/types";
import ApiClient from "@/lib/settlo-api-client";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { OperatingHoursEntry } from "./business";

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || process.env.SERVICE_URL || "";

interface ApiLocationResponse {
  id: string;
  accountId: string;
  businessId: string;
  businessName: string;
  name: string;
  description?: string;
  phoneNumber?: string;
  email?: string;
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

/**
 * Creates a standalone location for a user who already has a business
 * but somehow doesn't have a location yet (edge case).
 *
 * Uses POST /api/v1/locations (Accounts Service).
 */
export const createStandaloneLocation = async (data: {
  businessId: string;
  name: string;
  description?: string;
  phoneNumber?: string;
  email?: string;
  countryId?: string;
  region?: string;
  address?: string;
  operatingHours?: OperatingHoursEntry[];
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

    const payload: Record<string, unknown> = {
      businessId: data.businessId,
      name: data.name,
      description: data.description,
      phoneNumber: data.phoneNumber,
      email: data.email,
      countryId: data.countryId || authToken.countryId,
      region: data.region,
      address: data.address,
    };

    if (data.operatingHours?.length) {
      payload.settings = { operatingHours: data.operatingHours };
    }

    const apiClient = new ApiClient();
    const apiResponse = await apiClient.post<ApiLocationResponse, typeof payload>(
      "/api/v1/locations",
      payload,
    );

    if (apiResponse) {
      // Update auth token
      const updatedToken = {
        ...authToken,
        isLocationRegistrationComplete: true,
      };
      await updateAuthToken(updatedToken);

      // Map API response to existing Location type and store cookie
      const location = {
        id: apiResponse.id,
        name: apiResponse.name,
        phone: apiResponse.phoneNumber || "",
        locationAccountNumber: "",
        email: apiResponse.email || "",
        city: apiResponse.region || "",
        region: apiResponse.region || "",
        street: apiResponse.address || "",
        address: apiResponse.address || "",
        description: apiResponse.description || "",
        image: "",
        openingTime: "",
        closingTime: "",
        status: apiResponse.active,
        isArchived: false,
        canDelete: false,
        dateCreated: apiResponse.createdAt || "",
        settings: "",
        business: apiResponse.businessId,
        businessName: apiResponse.businessName || "",
        locationBusinessType: "",
        locationBusinessTypeName: "",
        subscriptionStatus: "",
        subscriptionStartDate: "",
        subscriptionEndDate: "",
        type: null,
      };

      const cookieStore = await cookies();
      const isProduction = process.env.NODE_ENV === "production";

      cookieStore.set({
        name: "currentLocation",
        value: JSON.stringify(location),
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
      });

      // Also ensure business cookie and activeBusiness are set
      if (!cookieStore.get("activeBusiness")?.value) {
        const businessActive: activeBusiness = {
          businessId: apiResponse.businessId as any,
        };
        cookieStore.set({
          name: "activeBusiness",
          value: JSON.stringify(businessActive),
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? "strict" : "lax",
        });
      }

      // Refresh the access token so it picks up the new location claims
      try {
        const refreshResponse = await fetch(
          `${AUTH_SERVICE_URL}/auth/token-refresh`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: authToken.refreshToken }),
          },
        );

        if (refreshResponse.ok) {
          const refreshData: TokenRefreshResponse = await refreshResponse.json();
          await updateAuthToken({
            ...authToken,
            accessToken: refreshData.accessToken,
            refreshToken: refreshData.refreshToken || authToken.refreshToken,
            isLocationRegistrationComplete: true,
          });
          console.log("[LOCATION] Access token refreshed with new location claims");
        }
      } catch {
        console.warn("[LOCATION] Token refresh after location creation failed (non-critical)");
      }

      revalidatePath("/", "layout");

      return parseStringify({
        responseType: "success",
        message: "Location created successfully!",
        data: location,
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
        "Something went wrong while creating your location, please try again.",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
};
