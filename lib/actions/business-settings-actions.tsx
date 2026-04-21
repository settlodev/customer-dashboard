"use server";

import { revalidatePath } from "next/cache";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import type { BusinessSettings } from "@/types/business/type";

/**
 * Partial PATCH payload for `PATCH /api/v1/businesses/{id}/settings`.
 * Only the fields that the user actually changed should be present.
 *
 * `efdStatus` is read-only on the server and intentionally excluded.
 * `id`, `accountId`, `businessId`, `createdAt`, `updatedAt` are server-managed.
 */
export type UpdateBusinessSettingsRequest = Partial<
  Omit<
    BusinessSettings,
    | "id"
    | "accountId"
    | "businessId"
    | "efdStatus"
    | "createdAt"
    | "updatedAt"
  >
>;

export const getBusinessSettings = async (
  businessId: string,
): Promise<BusinessSettings> => {
  const apiClient = new ApiClient();
  const data = await apiClient.get(
    `/api/v1/businesses/${businessId}/settings`,
  );
  return parseStringify(data);
};

export const updateBusinessSettings = async (
  businessId: string,
  patch: UpdateBusinessSettingsRequest,
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.patch(
      `/api/v1/businesses/${businessId}/settings`,
      patch,
    );
    revalidatePath("/business");
    revalidatePath("/settings");
    return {
      responseType: "success",
      message: "Business settings updated successfully",
    };
  } catch (error) {
    return {
      responseType: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to update business settings",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};
