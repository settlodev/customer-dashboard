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
 * GET /api/v1/devices
 */
export const listAllDevices = async (): Promise<Device[]> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const response = await apiClient.get<Device[]>(
      `/api/v1/devices`,
    );
    return parseStringify(response);
  } catch (error) {
    throw error;
  }
};

/**
 * Search devices with pagination and filters.
 * GET /api/v1/devices?search=X&page=0&size=10
 */
export const searchDevices = async (
  q: string,
  page: number,
  pageLimit: number,
): Promise<ApiResponse<Device>> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    const params = new URLSearchParams();
    if (q) params.set("search", q);
    params.set("page", String(page > 0 ? page - 1 : 0));
    params.set("size", String(pageLimit ? pageLimit : 10));

    const deviceResponse = await apiClient.get(
      `/api/v1/devices?${params.toString()}`,
    );
    return parseStringify(deviceResponse);
  } catch (error) {
    throw error;
  }
};

/**
 * Get a single device by ID.
 * GET /api/v1/devices/{id}
 */
export const getDevice = async (id: UUID): Promise<Device> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const response = await apiClient.get<Device>(
      `/api/v1/devices/${id}`,
    );
    return parseStringify(response);
  } catch (error) {
    throw error;
  }
};

/**
 * Update a device's details (custom name, department, etc.).
 * PATCH /api/v1/devices/{id}
 */
export const updateDevice = async (
  id: UUID,
  data: { customName: string; departmentId?: string },
): Promise<{ success: boolean; error?: string }> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    await apiClient.patch(
      `/api/v1/devices/${id}`,
      data,
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
 * POST /api/v1/devices/{id}/logout
 */
export const logoutDevice = async (
  id: string,
): Promise<{ success: boolean; error?: string }> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    await apiClient.post(
      `/api/v1/devices/${id}/logout`,
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
 * POST /api/v1/devices/{id}/suspend
 * POST /api/v1/devices/{id}/unsuspend
 */
export const suspendDevice = async (
  id: string,
  suspended: boolean,
): Promise<{ success: boolean; error?: string }> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const action = suspended ? "suspend" : "unsuspend";
    await apiClient.post(
      `/api/v1/devices/${id}/${action}`,
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
 * DELETE /api/v1/devices/{id}
 */
export const deleteDevice = async (
  id: string,
): Promise<{ success: boolean; error?: string }> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    await apiClient.delete(
      `/api/v1/devices/${id}`,
    );

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete device:", error);
    return { success: false, error: "Failed to delete device" };
  }
};

/**
 * Deactivate a device.
 * POST /api/v1/devices/{id}/deactivate
 */
export const deactivateDevice = async (
  id: string,
): Promise<{ success: boolean; error?: string }> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    await apiClient.post(
      `/api/v1/devices/${id}/deactivate`,
      {},
    );

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to deactivate device:", error);
    return { success: false, error: "Failed to deactivate device" };
  }
};

/**
 * Activate a device.
 * POST /api/v1/devices/{id}/activate
 */
export const activateDevice = async (
  id: string,
): Promise<{ success: boolean; error?: string }> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    await apiClient.post(
      `/api/v1/devices/${id}/activate`,
      {},
    );

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to activate device:", error);
    return { success: false, error: "Failed to activate device" };
  }
};

/**
 * Archive a device.
 * POST /api/v1/devices/{id}/archive
 */
export const archiveDevice = async (
  id: string,
): Promise<{ success: boolean; error?: string }> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    await apiClient.post(
      `/api/v1/devices/${id}/archive`,
      {},
    );

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to archive device:", error);
    return { success: false, error: "Failed to archive device" };
  }
};

/**
 * Retire a device.
 * POST /api/v1/devices/{id}/retire
 */
export const retireDevice = async (
  id: string,
): Promise<{ success: boolean; error?: string }> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    await apiClient.post(
      `/api/v1/devices/${id}/retire`,
      {},
    );

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to retire device:", error);
    return { success: false, error: "Failed to retire device" };
  }
};
