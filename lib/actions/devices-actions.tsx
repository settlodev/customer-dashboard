"use server";
import { ApiResponse } from "@/types/types";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { Device } from "@/types/device/type";
import { UUID } from "node:crypto";
import { revalidatePath } from "next/cache";

interface CodeResponse {
  status: string;
  message: string;
  data: {
    code: string;
    expiresAt: string;
    validityMinutes: number;
    locationId: string;
  };
}

/**
 * Add a new device by name and generate a login code for it.
 * POST /api/auth/location/code/generate/{locationId}?customName=...
 */
export const addDevice = async (
  customName: string,
): Promise<{ success: boolean; data?: CodeResponse["data"]; error?: string }> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const response = await apiClient.post<CodeResponse, Record<string, never>>(
      `/api/auth/location/code/generate/${location?.id}?customName=${encodeURIComponent(customName)}`,
      {},
    );
    const parsed = parseStringify(response);

    revalidatePath("/settings");
    return { success: true, data: parsed.data };
  } catch (error: any) {
    console.error("Error adding device:", error);
    return {
      success: false,
      error: error?.message || "Failed to add device",
    };
  }
};

/**
 * Regenerate a login code for an existing device.
 * POST /api/auth/location/code/regenerate/{locationId}/{deviceId}
 */
export const regenerateDeviceCode = async (
  deviceId: string,
): Promise<{ success: boolean; data?: CodeResponse["data"]; error?: string }> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const response = await apiClient.post<CodeResponse, Record<string, never>>(
      `/api/auth/location/code/regenerate/${location?.id}/${deviceId}`,
      {},
    );
    const parsed = parseStringify(response);

    revalidatePath("/settings");
    return { success: true, data: parsed.data };
  } catch (error: any) {
    console.error("Error regenerating code:", error);
    return {
      success: false,
      error: error?.message || "Failed to regenerate code",
    };
  }
};

/**
 * List all devices for the current location (non-paginated).
 * GET /api/location-devices/{locationId}
 */
export const listAllDevices = async (): Promise<Device[]> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const response = await apiClient.get<Device[]>(
      `/api/location-devices/${location?.id}`,
    );
    return parseStringify(response);
  } catch (error) {
    throw error;
  }
};

/**
 * Search devices with pagination and filters.
 * POST /api/location-devices/{locationId}
 */
export const searchDevices = async (
  q: string,
  page: number,
  pageLimit: number,
): Promise<ApiResponse<Device>> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    const query = {
      filters: q
        ? [
            {
              key: "customName",
              operator: "LIKE",
              field_type: "STRING",
              value: q,
            },
          ]
        : [],
      sorts: [],
      page: page > 0 ? page - 1 : 0,
      size: pageLimit ? pageLimit : 10,
    };

    const location = await getCurrentLocation();

    const deviceResponse = await apiClient.post(
      `/api/location-devices/${location?.id}`,
      query,
    );
    return parseStringify(deviceResponse);
  } catch (error) {
    throw error;
  }
};

/**
 * Get a single device by ID.
 * GET /api/location-devices/{locationId}/{deviceId}
 */
export const getDevice = async (id: UUID): Promise<Device> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const response = await apiClient.get<Device>(
      `/api/location-devices/${location?.id}/${id}`,
    );
    return parseStringify(response);
  } catch (error) {
    throw error;
  }
};

/**
 * Update a device's details (custom name, department, etc.).
 * PUT /api/location-devices/{locationId}/{deviceId}
 */
export const updateDevice = async (
  id: UUID,
  data: { customName: string; departmentId?: string },
): Promise<{ success: boolean; error?: string }> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();

    await apiClient.put(
      `/api/location-devices/${location?.id}/${id}`,
      { ...data, location: location?.id },
    );

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Error updating device:", error);
    return { success: false, error: "Failed to update device" };
  }
};

/**
 * Remotely logout a device.
 * POST /api/location-devices/{locationId}/{deviceId}
 */
export const logoutDevice = async (
  id: string,
): Promise<{ success: boolean; error?: string }> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    await apiClient.post(
      `/api/location-devices/${location?.id}/${id}`,
      {},
    );

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to logout device:", error);
    return { success: false, error: "Failed to logout device" };
  }
};

/**
 * Suspend or unsuspend a device's data access.
 * When suspended, reports and sales data are hidden from the device.
 * PUT /api/location-devices/{locationId}/{deviceId}
 */
/**
 * Suspend or unsuspend a device's data access.
 * PUT /api/location-devices/{locationId}/{deviceId}/suspend
 * PUT /api/location-devices/{locationId}/{deviceId}/unsuspend
 */
export const suspendDevice = async (
  id: string,
  suspended: boolean,
): Promise<{ success: boolean; error?: string }> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const action = suspended ? "suspend" : "unsuspend";
    await apiClient.put(
      `/api/location-devices/${location?.id}/${id}/${action}`,
      {},
    );

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error(`Failed to ${suspended ? "suspend" : "unsuspend"} device:`, error);
    return { success: false, error: suspended ? "Failed to suspend device" : "Failed to restore device" };
  }
};

/**
 * Permanently delete a device from the location.
 * DELETE /api/location-devices/{locationId}/{deviceId}
 */
export const deleteDevice = async (
  id: string,
): Promise<{ success: boolean; error?: string }> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    await apiClient.delete(
      `/api/location-devices/${location?.id}/${id}`,
    );

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete device:", error);
    return { success: false, error: "Failed to delete device" };
  }
};
