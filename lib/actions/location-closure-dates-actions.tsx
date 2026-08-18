"use server";

import { revalidatePath } from "next/cache";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import type {
  LocationClosureDate,
  CreateClosureDatePayload,
  UpdateClosureDatePayload,
} from "@/types/location-closure-date/type";
import { ClosureDateSchema } from "@/types/location-closure-date/schema";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";

async function resolveLocationId(): Promise<string | null> {
  const loc = await getCurrentLocation();
  return loc?.id ?? null;
}

const BASE = (locationId: string) =>
  `/api/v1/locations/${locationId}/closure-dates`;

export async function listClosureDates(
  upcomingOnly: boolean = false,
): Promise<LocationClosureDate[]> {
  const locationId = await resolveLocationId();
  if (!locationId) return [];
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      `${BASE(locationId)}?upcomingOnly=${upcomingOnly}`,
    );
    return parseStringify(data) ?? [];
  } catch {
    return [];
  }
}

export async function createClosureDate(
  input: CreateClosureDatePayload,
): Promise<FormResponse<LocationClosureDate>> {
  const locationId = await resolveLocationId();
  if (!locationId) {
    return { responseType: "error", message: "No active location" };
  }
  const validated = ClosureDateSchema.safeParse(input);
  if (!validated.success) {
    return {
      responseType: "error",
      message: "Please fix the highlighted fields",
      error: new Error(validated.error.message),
    };
  }
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      BASE(locationId),
      validated.data,
    )) as LocationClosureDate;
    revalidatePath("/settings");
    return {
      responseType: "success",
      message: "Closure date added",
      data: parseStringify(data),
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to add closure date",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function updateClosureDate(
  closureDateId: string,
  input: UpdateClosureDatePayload,
): Promise<FormResponse<LocationClosureDate>> {
  const locationId = await resolveLocationId();
  if (!locationId) {
    return { responseType: "error", message: "No active location" };
  }
  const validated = ClosureDateSchema.safeParse(input);
  if (!validated.success) {
    return {
      responseType: "error",
      message: "Please fix the highlighted fields",
      error: new Error(validated.error.message),
    };
  }
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.put(
      `${BASE(locationId)}/${closureDateId}`,
      validated.data,
    )) as LocationClosureDate;
    revalidatePath("/settings");
    return {
      responseType: "success",
      message: "Closure date updated",
      data: parseStringify(data),
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to update closure date",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function deleteClosureDate(
  closureDateId: string,
): Promise<FormResponse> {
  const locationId = await resolveLocationId();
  if (!locationId) {
    return { responseType: "error", message: "No active location" };
  }
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(`${BASE(locationId)}/${closureDateId}`);
    revalidatePath("/settings");
    return { responseType: "success", message: "Closure date removed" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to remove closure date",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
