"use server";

import { revalidatePath } from "next/cache";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import {
  getCurrentBusiness,
  getCurrentLocation,
} from "@/lib/actions/business/get-current-business";
import type { ApiResponse } from "@/types/types";
import type {
  AssignmentType,
  Device,
  DeviceCounts,
  DeviceSettings,
  DeviceStatus,
  ResolvedDeviceSettings,
} from "@/types/device/type";

type Ok<T> = { responseType: "success"; message: string; data: T };
type Err = { responseType: "error"; message: string; error: Error };
export type DeviceActionResponse<T> = Ok<T> | Err;

const okVoid = (message: string): Ok<null> => ({
  responseType: "success",
  message,
  data: null,
});

const err = (fallback: string, e: unknown): Err => ({
  responseType: "error",
  message: e instanceof Error ? e.message : fallback,
  error: e instanceof Error ? e : new Error(String(e)),
});

// ──────────────────────────────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────────────────────────────

export const listDevices = async (
  assignedToId: string,
  assignmentType: AssignmentType,
  status?: DeviceStatus,
): Promise<ApiResponse<Device>> => {
  const apiClient = new ApiClient();
  const params = new URLSearchParams({
    assignedToId,
    assignmentType,
  });
  if (status) params.append("status", status);
  const data = await apiClient.get(
    `/api/v1/devices?${params.toString()}`,
  );
  return parseStringify(data);
};

export const getDevice = async (id: string): Promise<Device> => {
  const apiClient = new ApiClient();
  const data = await apiClient.get(`/api/v1/devices/${id}`);
  return parseStringify(data);
};

export const getDeviceCounts = async (
  assignedToId: string,
  assignmentType: AssignmentType,
): Promise<DeviceCounts> => {
  const apiClient = new ApiClient();
  const params = new URLSearchParams({ assignedToId, assignmentType });
  const data = await apiClient.get<{ total: number; active: number }>(
    `/api/v1/devices/count?${params.toString()}`,
  );
  return parseStringify(data);
};

export const checkDeviceNameExists = async (
  assignedToId: string,
  assignmentType: AssignmentType,
  deviceName: string,
): Promise<boolean> => {
  const apiClient = new ApiClient();
  const params = new URLSearchParams({
    assignedToId,
    assignmentType,
    deviceName,
  });
  const data = await apiClient.post<{ exists: boolean }, Record<string, never>>(
    `/api/v1/devices/check-existence?${params.toString()}`,
    {},
  );
  return Boolean(data?.exists);
};

// ──────────────────────────────────────────────────────────────────────
// Edit (customName, departmentId) — PATCH /api/v1/devices/{id}
// ──────────────────────────────────────────────────────────────────────

export type UpdateDevicePatch = {
  customName?: string | null;
  departmentId?: string | null;
};

export const updateDevice = async (
  id: string,
  patch: UpdateDevicePatch,
): Promise<DeviceActionResponse<Device>> => {
  try {
    const apiClient = new ApiClient();
    const updated = await apiClient.patch<Device, UpdateDevicePatch>(
      `/api/v1/devices/${id}`,
      patch,
    );
    revalidatePath("/settings");
    return {
      responseType: "success",
      message: "Device updated",
      data: parseStringify(updated),
    };
  } catch (e) {
    return err("Failed to update device", e);
  }
};

export const updateDevicePinRequired = async (
  id: string,
  pinRequired: boolean,
): Promise<DeviceActionResponse<Device>> => {
  try {
    const apiClient = new ApiClient();
    const updated = await apiClient.patch<Device, { pinRequired: boolean }>(
      `/api/v1/devices/${id}/pin-required`,
      { pinRequired },
    );
    revalidatePath("/settings");
    return {
      responseType: "success",
      message: pinRequired ? "PIN required" : "PIN no longer required",
      data: parseStringify(updated),
    };
  } catch (e) {
    return err("Failed to update PIN requirement", e);
  }
};

// ──────────────────────────────────────────────────────────────────────
// Lifecycle
// ──────────────────────────────────────────────────────────────────────

const lifecycleTransition =
  (path: string, successMessage: string, fallback: string) =>
  async (id: string): Promise<DeviceActionResponse<Device>> => {
    try {
      const apiClient = new ApiClient();
      const updated = await apiClient.post<Device, Record<string, never>>(
        `/api/v1/devices/${id}/${path}`,
        {},
      );
      revalidatePath("/settings");
      return {
        responseType: "success",
        message: successMessage,
        data: parseStringify(updated),
      };
    } catch (e) {
      return err(fallback, e);
    }
  };

export const suspendDevice = lifecycleTransition(
  "suspend",
  "Device suspended",
  "Failed to suspend device",
);

export const unsuspendDevice = lifecycleTransition(
  "unsuspend",
  "Device unsuspended",
  "Failed to unsuspend device",
);

export const activateDevice = lifecycleTransition(
  "activate",
  "Device activated",
  "Failed to activate device",
);

export const deactivateDevice = lifecycleTransition(
  "deactivate",
  "Device deactivated",
  "Failed to deactivate device",
);

export const archiveDevice = lifecycleTransition(
  "archive",
  "Device archived",
  "Failed to archive device",
);

export const retireDevice = lifecycleTransition(
  "retire",
  "Device retired",
  "Failed to retire device",
);

export const logoutDevice = async (
  id: string,
): Promise<DeviceActionResponse<null>> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post<void, Record<string, never>>(
      `/api/v1/devices/${id}/logout`,
      {},
    );
    revalidatePath("/settings");
    return okVoid("Device logged out");
  } catch (e) {
    return err("Failed to log out device", e);
  }
};

export const deleteDevice = async (
  id: string,
): Promise<DeviceActionResponse<null>> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(`/api/v1/devices/${id}`);
    revalidatePath("/settings");
    return okVoid("Device deleted");
  } catch (e) {
    return err("Failed to delete device", e);
  }
};

// ──────────────────────────────────────────────────────────────────────
// Device settings (per-device orderingMode override)
// ──────────────────────────────────────────────────────────────────────

export type DeviceSettingsPatch = {
  locationId: string;
  orderingMode?: "STANDARD" | "TABLE_MANAGEMENT" | null;
};

export const getDeviceSettings = async (
  id: string,
): Promise<DeviceSettings | null> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/devices/${id}/settings`);
    return parseStringify(data);
  } catch {
    return null;
  }
};

export const resolveDeviceSettings = async (
  id: string,
  locationId: string,
): Promise<ResolvedDeviceSettings | null> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      `/api/v1/devices/${id}/settings/resolved?locationId=${locationId}`,
    );
    return parseStringify(data);
  } catch {
    return null;
  }
};

export const updateDeviceSettings = async (
  id: string,
  patch: DeviceSettingsPatch,
): Promise<DeviceActionResponse<DeviceSettings>> => {
  try {
    const apiClient = new ApiClient();
    const updated = await apiClient.put<DeviceSettings, DeviceSettingsPatch>(
      `/api/v1/devices/${id}/settings`,
      patch,
    );
    revalidatePath("/settings");
    return {
      responseType: "success",
      message: "Device settings updated",
      data: parseStringify(updated),
    };
  } catch (e) {
    return err("Failed to update device settings", e);
  }
};

export const deleteDeviceSettings = async (
  id: string,
): Promise<DeviceActionResponse<null>> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(`/api/v1/devices/${id}/settings`);
    revalidatePath("/settings");
    return okVoid("Device settings reset to location defaults");
  } catch (e) {
    return err("Failed to reset device settings", e);
  }
};

// ──────────────────────────────────────────────────────────────────────
// Pairing codes — POST /devices/pairing-codes on the Auth Service
// ──────────────────────────────────────────────────────────────────────

export type GeneratePairingCodeInput = {
  deviceName?: string;
  pinRequired?: boolean;
};

export type PairingCode = {
  pairingCodeId: string;
  code: string;
  expiresAt: string;
  expiresInSeconds: number;
  message?: string;
};

export const generatePairingCode = async (
  input: GeneratePairingCodeInput = {},
): Promise<DeviceActionResponse<PairingCode>> => {
  try {
    const [business, location] = await Promise.all([
      getCurrentBusiness(),
      getCurrentLocation(),
    ]);
    if (!business?.accountId || !business?.id || !location?.id) {
      return {
        responseType: "error",
        message: "Select a business and location before pairing a device.",
        error: new Error("Missing business or location context"),
      };
    }
    const trimmedName = input.deviceName?.trim();
    const body = {
      accountId: business.accountId,
      businessId: business.id,
      assignedToId: location.id,
      assignmentType: "LOCATION" as const,
      deviceName: trimmedName && trimmedName.length > 0 ? trimmedName : undefined,
      pinRequired: input.pinRequired ?? true,
    };

    const apiClient = new ApiClient("auth");
    const data = await apiClient.post<PairingCode, typeof body>(
      `/devices/pairing-codes`,
      body,
    );
    return {
      responseType: "success",
      message: "Pairing code generated",
      data: parseStringify(data),
    };
  } catch (e) {
    return err("Failed to generate pairing code", e);
  }
};
