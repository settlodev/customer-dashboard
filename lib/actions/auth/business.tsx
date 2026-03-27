"use server";

import { getAuthToken, updateAuthToken } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import { FormResponse, activeBusiness } from "@/types/types";
import ApiClient from "@/lib/settlo-api-client";
import { cookies } from "next/headers";
import { Business } from "@/types/business/type";
import { Location } from "@/types/location/type";
import { revalidatePath } from "next/cache";

interface BusinessWithLocationsPayload {
  business: {
    name: string;
    description?: string;
    phoneNumber?: string;
    email?: string;
    countryId?: string;
    businessTypeId?: string;
    region?: string;
    address?: string;
    logoUrl?: string;
  };
  businessSettings?: Record<string, unknown>;
  locations: Array<{
    name: string;
    description?: string;
    phoneNumber?: string;
    email?: string;
    region?: string;
    address?: string;
    settings?: {
      operatingHours?: Array<{
        dayOfWeek: string;
        openTime: string;
        closeTime: string;
        closed: boolean;
      }>;
    };
  }>;
}

// API response types from POST /api/v1/businesses/with-locations
interface ApiBusinessResponse {
  id: string;
  accountId: string;
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
  timezone?: string;
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
}

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
    name: apiBusiness.name,
    description: apiBusiness.description || "",
    slug: apiBusiness.slug || "",
    businessType: apiBusiness.businessTypeId || "",
    businessTypeName: apiBusiness.businessTypeName || "",
    businessAccountNumber: "",
    prefix: "",
    tax: 0,
    identificationNumber: "",
    vrn: "",
    serial: "",
    uin: "",
    receiptPrefix: "",
    receiptSuffix: "",
    image: apiBusiness.logoUrl || "",
    receiptImage: "",
    logo: apiBusiness.logoUrl || "",
    primaryColor: null,
    secondaryColor: null,
    bannerImageUrl: null,
    faviconUrl: null,
    fontFamily: null,
    metaTitle: null,
    metaDescription: null,
    shareImageUrl: null,
    facebook: "",
    twitter: "",
    instagram: "",
    linkedin: "",
    youtube: "",
    tiktok: "",
    certificateOfIncorporation: "",
    businessIdentificationDocument: "",
    businessLicense: "",
    memarts: "",
    notificationPhone: apiBusiness.phoneNumber || "",
    notificationEmailAddress: apiBusiness.email || "",
    vfdRegistrationState: false,
    website: apiBusiness.website || "",
    canDelete: false,
    status: apiBusiness.active,
    user: apiBusiness.accountId as any,
    country: apiBusiness.countryId as any,
    countryName: "",
    isArchived: false,
    totalLocations: 0,
    allLocations: [],
  } as Business;
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
    name: apiLocation.name,
    phone: apiLocation.phoneNumber || "",
    locationAccountNumber: "",
    email: apiLocation.email || "",
    city: apiLocation.region || "",
    region: apiLocation.region || "",
    street: apiLocation.address || "",
    address: apiLocation.address || "",
    description: apiLocation.description || "",
    image: "",
    openingTime: "",
    closingTime: "",
    status: apiLocation.active,
    isArchived: false,
    canDelete: false,
    dateCreated: apiLocation.createdAt || "",
    settings: "" as any,
    business: apiLocation.businessId as any,
    businessName: apiLocation.businessName || "",
    locationBusinessType: "" as any,
    locationBusinessTypeName: "",
    subscriptionStatus: "" as any,
    subscriptionStartDate: "",
    subscriptionEndDate: "",
    type: null,
  } as Location;
}

function generateOperatingHours(
  openingTime: string,
  closingTime: string,
) {
  const days = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ];
  return days.map((day) => ({
    dayOfWeek: day,
    openTime: openingTime,
    closeTime: closingTime,
    closed: false,
  }));
}

export const createBusinessWithLocations = async (data: {
  businessName: string;
  locationName: string;
  description?: string;
  phoneNumber?: string;
  email?: string;
  businessTypeId?: string;
  countryId?: string;
  region?: string;
  address?: string;
  logoUrl?: string;
  openingTime?: string;
  closingTime?: string;
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
        countryId: data.countryId || authToken.countryId,
        businessTypeId: data.businessTypeId,
        region: data.region,
        address: data.address,
        logoUrl: data.logoUrl,
      },
      locations: [
        {
          name: data.locationName,
          phoneNumber: data.phoneNumber,
          email: data.email,
          region: data.region,
          address: data.address,
          settings: {
            operatingHours: generateOperatingHours(
              data.openingTime || "08:00",
              data.closingTime || "18:00",
            ),
          },
        },
      ],
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
        name: business.name,
        prefix: business.prefix,
        businessType: business.businessType,
        logo: business.logo || null,
        status: business.status,
        user: business.user,
        country: business.country,
        countryName: business.countryName,
        isArchived: business.isArchived,
        totalLocations: locations.length,
      };

      cookieStore.set({
        name: "currentBusiness",
        value: JSON.stringify(minimalBusiness),
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
      });

      const businessActive: activeBusiness = {
        businessId: business.id,
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

// Keep legacy createBusiness for backward compatibility within the app
export const createBusiness = async (
  business: any,
): Promise<FormResponse | void> => {
  return createBusinessWithLocations({
    businessName: business.name,
    locationName: business.locationName || "Main Location",
    description: business.description,
    phoneNumber: business.phoneNumber || business.phone,
    email: business.email,
    businessTypeId: business.businessType || business.businessTypeId,
    countryId: business.country || business.countryId,
    region: business.city || business.region,
    address: business.address,
    logoUrl: business.image || business.logoUrl,
    openingTime: business.openingTime,
    closingTime: business.closingTime,
  });
};
