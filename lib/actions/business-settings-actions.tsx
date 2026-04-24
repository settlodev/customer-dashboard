"use server";

import { revalidatePath } from "next/cache";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { BusinessSettings } from "@/types/business/type";

export type UpdateBusinessSettingsResponse =
  | { responseType: "success"; message: string; data: BusinessSettings }
  | { responseType: "error"; message: string; error: Error };

/**
 * Partial payload for `PUT /api/v1/businesses/{id}/settings`.
 * The accounts service applies a partial-update pattern: only non-null
 * fields are written to the entity, so the dashboard sends just the fields
 * the user actually changed.
 *
 * `efdStatus` is a server-managed state machine (auto-set to REQUESTED when
 * `enableVirtualEfd` is turned on, then progressed by the service). It is
 * excluded here so UI code can't accidentally overwrite it.
 * `id`, `accountId`, `businessId`, `businessName`, `createdAt`, `updatedAt`
 * are all server-managed or derived.
 */
export type UpdateBusinessSettingsRequest = Partial<
  Omit<
    BusinessSettings,
    | "id"
    | "accountId"
    | "businessId"
    | "businessName"
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
): Promise<UpdateBusinessSettingsResponse> => {
  try {
    const apiClient = new ApiClient();
    const updated = await apiClient.put<BusinessSettings, UpdateBusinessSettingsRequest>(
      `/api/v1/businesses/${businessId}/settings`,
      patch,
    );
    revalidatePath("/business");
    revalidatePath("/settings");
    return {
      responseType: "success",
      message: "Business settings updated successfully",
      data: parseStringify(updated),
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
