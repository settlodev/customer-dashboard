"use server";

import { UUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
import { refreshLocation } from "./business/refresh";

export const fetchAllLocations = async (): Promise<Location[] | null> => {
  try {
    const business = await getCurrentBusiness();

    if (!business) {
      return null;
    }

    const apiClient = new ApiClient();

    const locationsData = await apiClient.get(`/api/locations/${business.id}`);

    return parseStringify(locationsData);
  } catch (error) {
    console.error("Error in fetchAllLocations:", error);
    throw error;
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

    const data = await apiClient.post(`/api/locations/${business?.id}`, query);

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
    // Authentication check
    const authenticatedUser = await getAuthenticatedUser();
    if ("responseType" in authenticatedUser) {
      return parseStringify({
        responseType: "error",
        message: "Authentication failed",
        error: new Error("User not authenticated"),
      });
    }

    // Validate input data
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const apiClient = new ApiClient();
    const response = await apiClient.post(
      `/api/locations/${targetBusinessId}/create`,
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
        redirect("/business");
      } else {
        revalidatePath("/locations");
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
    await apiClient.put(`/api/locations/${business.id}/${id}`, payload);

    // Refresh location data if we're updating the current location
    if (currentLocation?.id === id) {
      const updatedLocation = {
        ...currentLocation,
      };

      await refreshLocation(updatedLocation);
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

export const getLocation = async (id: UUID): Promise<ApiResponse<Location>> => {
  const apiClient = new ApiClient();

  const query = {
    filters: [
      {
        key: "id",
        operator: "EQUAL",
        field_type: "UUID_STRING",
        value: id,
      },
    ],
    sorts: [],
    page: 0,
    size: 1,
  };

  const business = await getCurrentBusiness();

  const data = await apiClient.post(`/api/locations/${business?.id}`, query);

  return parseStringify(data);
};

export const getLocationById = async (): Promise<Location> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const business = await getCurrentBusiness();
    const currentLocation = await getCurrentLocation();

    const data = await apiClient.get(
      `/api/locations/${business?.id}/${currentLocation?.id}`,
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

    await apiClient.delete(`/api/locations/${business?.id}/${id}`);
    revalidatePath("/locations");
  } catch (error) {
    throw error;
  }
};
