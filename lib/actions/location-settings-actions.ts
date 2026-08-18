"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { FormResponse } from "@/types/types";
import type { LocationSettings } from "@/types/location-settings/type";
import type { LocationSettingsUpdate } from "@/types/location-settings/schema";
import { LocationSettingsSchema } from "@/types/location-settings/schema";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";

const BASE = (locationId: string) => `/api/v1/locations/${locationId}/settings`;

async function resolveLocationId(): Promise<string | null> {
  const loc = await getCurrentLocation();
  return loc?.id ?? null;
}

export async function getLocationSettings(): Promise<LocationSettings | null> {
  const locationId = await resolveLocationId();
  if (!locationId) return null;
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(BASE(locationId));
    return parseStringify(data);
  } catch {
    return null;
  }
}

/**
 * Partial update against the LocationSettings endpoint. Only fields that are
 * explicitly present on `input` are sent — anything `undefined` is omitted so
 * the backend keeps its current value. Empty strings are also stripped to
 * avoid blanking fields users haven't intentionally cleared. Pass `null`
 * explicitly for fields where `null` is the intended value (e.g.
 * `dailyCutoffTime` when `continuousOperation` is being turned off).
 */
export async function updateLocationSettings(
  input: LocationSettingsUpdate,
): Promise<FormResponse<LocationSettings>> {
  const locationId = await resolveLocationId();
  if (!locationId) {
    return { responseType: "error", message: "No active location" };
  }

  const validated = LocationSettingsSchema.safeParse(input);
  if (!validated.success) {
    return {
      responseType: "error",
      message: "Please fix the highlighted fields",
      error: new Error(validated.error.message),
    };
  }

  // Strip undefined and empty strings so we don't overwrite backend values
  // with "" when the user left a field untouched. `null` is preserved.
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(validated.data)) {
    if (v === undefined) continue;
    if (typeof v === "string" && v === "") continue;
    payload[k] = v;
  }

  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.put(BASE(locationId), payload)) as LocationSettings;
    revalidatePath("/settings");
    return {
      responseType: "success",
      message: "Settings saved",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save settings";
    return {
      responseType: "error",
      message,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function resetLocationSettings(): Promise<FormResponse<LocationSettings>> {
  const locationId = await resolveLocationId();
  if (!locationId) {
    return { responseType: "error", message: "No active location" };
  }
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      `${BASE(locationId)}/reset`,
      {},
    )) as LocationSettings;
    revalidatePath("/settings");
    return {
      responseType: "success",
      message: "Settings reset to defaults",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to reset settings";
    return {
      responseType: "error",
      message,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
