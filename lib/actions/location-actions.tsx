"use server";

type UUID = string;

import { revalidatePath } from "next/cache";

import * as z from "zod";

import { getAuthenticatedUser } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import ApiClient from "@/lib/settlo-api-client";
import { ApiResponse, FormResponse } from "@/types/types";
import {
  getCurrentBusiness,
  getCurrentLocation,
} from "@/lib/actions/business/get-current-business";
import { Location } from "@/types/location/type";
import { LocationSchema } from "@/types/location/schema";
import { switchToLocation } from "./destination";

export const fetchAllLocations = async (): Promise<Location[] | null> => {
  try {
    const business = await getCurrentBusiness();

    if (!business) {
      return null;
    }

    const apiClient = new ApiClient();

    const locationsData = await apiClient.get(
      `/api/v1/locations?businessId=${business.id}`,
    );

    return parseStringify(locationsData);
  } catch (error: unknown) {
    const message = (error && typeof error === "object" && "message" in error)
      ? (error as { message: string }).message
      : "Unknown error";
    console.error("Error in fetchAllLocations:", message);
    return null;
  }
};

export const searchLocations = async (
  q: string,
  page: number,
  pageLimit: number,
): Promise<ApiResponse<Location>> => {
  await getAuthenticatedUser();

  try {
    const business = await getCurrentBusiness();
    const apiClient = new ApiClient();

    const query = {
      filters: [
        {
          key: "name",
          operator: "LIKE",
          field_type: "UUID_STRING",
          value: q,
        },
        {
          key: "isArchived",
          operator: "EQUAL",
          field_type: "BOOLEAN",
          value: false,
        },
      ],
      sorts: [
        {
          key: "name",
          direction: "ASC",
        },
      ],
      page: page ? page - 1 : 0,
      size: pageLimit ? pageLimit : 10,
    };

    const params = new URLSearchParams();
    if (q) params.append("search", q);
    params.append("page", String(page ? page - 1 : 0));
    params.append("size", String(pageLimit || 10));
    params.append("sort", "name,asc");
    if (business?.id) params.append("businessId", business.id);

    const data = await apiClient.get(`/api/v1/locations?${params.toString()}`);

    return parseStringify(data);
  } catch (error) {
    console.error("Error in search locations:", error);
    throw error;
  }
};

export const createLocation = async (
  location: z.infer<typeof LocationSchema>,
  businessId?: string,
): Promise<FormResponse> => {
  let formResponse: FormResponse | null = null;

  try {
    const authenticatedUser = await getAuthenticatedUser();
    if ("responseType" in authenticatedUser) {
      return parseStringify({
        responseType: "error",
        message: "Authentication failed",
        error: new Error("User not authenticated"),
      });
    }

    const validatedData = LocationSchema.safeParse(location);

    if (!validatedData.success) {
      return parseStringify({
        responseType: "error",
        message:
          "Please fill in all the fields marked with * before proceeding",
        error: new Error(validatedData.error.message),
      });
    }

    let targetBusinessId = businessId;

    if (!targetBusinessId) {
      const currentBusiness = await getCurrentBusiness();
      targetBusinessId = currentBusiness?.id;
    }

    if (!targetBusinessId) {
      console.error("Business not found", {
        authenticatedUser,
        location,
        businessId,
      });
      return parseStringify({
        responseType: "error",
        message:
          "Business information not found. Please ensure a business is selected.",
        error: new Error("Business ID is required"),
      });
    }

    const payload = {
      ...validatedData.data,
      business: targetBusinessId,
    };

    const apiClient = new ApiClient();
    const response = await apiClient.post(
      `/api/v1/locations`,
      payload,
    );

    formResponse = parseStringify({
      responseType: "success",
      message: "Location created successfully",
      data: response,
    });
  } catch (error: unknown) {
    return parseStringify({
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }

  if (formResponse) {
    if (formResponse.responseType === "success") {
      // Use businessId to determine if this is multistep
      if (businessId) {
        revalidatePath("/business");
      } else {
        revalidatePath("/select-location");
      }
    }
    return formResponse;
  }

  // Fallback
  return parseStringify({
    responseType: "error",
    message: "An unexpected error occurred",
    error: new Error("No response was generated"),
  });
};

export const updateLocation = async (
  id: UUID,
  location: z.infer<typeof LocationSchema>,
): Promise<FormResponse> => {
  let formResponse: FormResponse | null = null;
  // Validate location data
  const validatedData = LocationSchema.safeParse(location);
  if (!validatedData.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill in all the fields marked with * before proceeding",
      error: new Error(validatedData.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();
    const business = await getCurrentBusiness();
    const currentLocation = await getCurrentLocation();

    if (!business?.id) {
      return parseStringify({
        responseType: "error",
        message: "Business information not found",
        error: new Error("Missing business ID"),
      });
    }

    const payload = {
      ...validatedData.data,
      business: business.id,
    };
    // Make the API call to update location
    await apiClient.put(`/api/v1/locations/${id}`, payload);

    // Refresh location data if we're updating the current location
    if (currentLocation?.id === id) {
      const updatedLocation = {
        ...currentLocation,
      };

      await switchToLocation(updatedLocation);
    }
  } catch (error: unknown) {
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  formResponse = parseStringify({
    responseType: "success",
    message: "Location updated successfully",
  });

  revalidatePath("/select-location");
  return parseStringify(formResponse);
};

export const getLocation = async (id: UUID): Promise<Location> => {
  const apiClient = new ApiClient();

  const data = await apiClient.get(`/api/v1/locations/${id}`);

  return parseStringify(data);
};

/**
 * Partial payload for `PUT /api/v1/locations/{id}` — mirrors the
 * `UpdateLocationRequest` DTO on the accounts service exactly. The service
 * applies a partial-update pattern: only non-null fields are written.
 * Immutable fields (id, accountId, businessId, identifier, slug) are not
 * accepted by the endpoint and must not be sent.
 */
export type UpdateLocationBasicsRequest = {
  name?: string;
  description?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  countryId?: string | null;
  businessTypeId?: string | null;
  region?: string | null;
  district?: string | null;
  ward?: string | null;
  address?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string | null;
  active?: boolean;
};

export type UpdateLocationBasicsResponse =
  | { responseType: "success"; message: string; data: Location }
  | { responseType: "error"; message: string; error: Error };

export const updateLocationBasics = async (
  id: UUID,
  patch: UpdateLocationBasicsRequest,
): Promise<UpdateLocationBasicsResponse> => {
  try {
    const apiClient = new ApiClient();
    const updated = await apiClient.put<Location, UpdateLocationBasicsRequest>(
      `/api/v1/locations/${id}`,
      patch,
    );
    revalidatePath("/select-location");
    revalidatePath("/settings");
    return {
      responseType: "success",
      message: "Location updated successfully",
      data: parseStringify(updated),
    };
  } catch (error) {
    return {
      responseType: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to update location",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const getLocationById = async (): Promise<Location> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const business = await getCurrentBusiness();
    const currentLocation = await getCurrentLocation();

    const data = await apiClient.get(
      `/api/v1/locations/${currentLocation?.id}`,
    );

    return parseStringify(data);
  } catch (error) {
    console.error("Error fetching location:", error);
    throw error;
  }
};

export const generateLocationCode = async (): Promise<any> => {
  await getAuthenticatedUser();
  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const response = await apiClient.get(
      `/api/auth/location/code/generate/${location?.id}`,
    );
    return parseStringify(response);
  } catch (error) {
    console.error("Error generating location:", error);
    throw error;
  }
};

export const deleteLocation = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("Location ID is required to perform this request");
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    const business = await getCurrentBusiness();

    await apiClient.delete(`/api/v1/locations/${id}`);
    revalidatePath("/locations");
  } catch (error) {
    throw error;
  }
};

export const deactivateLocation = async (id: UUID): Promise<FormResponse> => {
  if (!id) throw new Error("Location ID is required");
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/locations/${id}/deactivate`, {});
    revalidatePath("/locations");
    return { responseType: "success", message: "Location deactivated successfully" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to deactivate location",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const reactivateLocation = async (id: UUID): Promise<FormResponse> => {
  if (!id) throw new Error("Location ID is required");
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/locations/${id}/reactivate`, {});
    revalidatePath("/locations");
    return { responseType: "success", message: "Location reactivated successfully" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to reactivate location",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const getLocationCount = async (businessId?: string): Promise<{ total: number; active: number; inactive: number }> => {
  try {
    const apiClient = new ApiClient();
    const params = businessId ? `?businessId=${businessId}` : "";
    const data = await apiClient.get(`/api/v1/locations/count${params}`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};
