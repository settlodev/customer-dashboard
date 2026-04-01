"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { UUID } from "node:crypto";
import {
  getCurrentLocation,
} from "./business/get-current-business";
import { NotificationSettingsSchema } from "@/types/notification/shema";
import { LocationSettingsSchema } from "@/types/settings/schema";
import {
  PhysicalReceiptPaymentDetails,
  physicalReceiptPaymentDetailsSchema,
} from "@/types/payments/schema";

export const fetchLocationSettings = async (): Promise<any> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();

    const settingsData = await apiClient.get(
      `/api/v1/locations/${location?.id}/settings`,
    );

    return parseStringify(settingsData);
  } catch (error) {
    throw error;
  }
};

export const updateLocationSettings = async (
  id: UUID,
  setting: z.infer<typeof LocationSettingsSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;
  const validSettingsData = LocationSettingsSchema.safeParse(setting);

  if (!validSettingsData.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validSettingsData.error.message),
    };
    return parseStringify(formResponse);
  }

  const locationId = await getCurrentLocation();
  const payload = validSettingsData.data;

  try {
    const apiClient = new ApiClient();

    await apiClient.put(
      `/api/v1/locations/${locationId?.id}/settings`,
      payload,
    );
  } catch (error) {
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  if (formResponse) {
    return parseStringify(formResponse);
  }
  revalidatePath("/settings");
};

export const updateNotificationSetting = async (
  notifications: z.infer<typeof NotificationSettingsSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;
  const validNotificationSetting =
    NotificationSettingsSchema.safeParse(notifications);

  if (!validNotificationSetting.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validNotificationSetting.error.message),
    };
    return parseStringify(formResponse);
  }

  const locationId = await getCurrentLocation();
  const payload = {
    ...validNotificationSetting.data,
  };

  try {
    const apiClient = new ApiClient();

    await apiClient.put(
      `/api/v1/locations/${locationId?.id}/settings`,
      payload,
    );
  } catch (error) {
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  if (formResponse) {
    return parseStringify(formResponse);
  }
};

export const physicalReceiptPaymentDetails = async (
  methods: PhysicalReceiptPaymentDetails,
): Promise<any> => {
  await getAuthenticatedUser();

  const validated = physicalReceiptPaymentDetailsSchema.safeParse(methods);

  if (!validated.success) {
    const errors = validated.error.errors.map((err) => {
      const path = err.path.join(".");
      return path ? `${path}: ${err.message}` : err.message;
    });

    throw new Error(`Validation failed: ${errors.join("; ")}`);
  }

  const payload = validated.data;
  console.log("The payload", payload);

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();

    const physicalReceipt = await apiClient.post(
      `/api/physical-receipt-payment-details/${location?.id}/create`,
      payload,
    );
    return parseStringify(physicalReceipt);
  } catch (error) {
    console.error("Failed to store physical receipt payment details:", error);
    throw error;
  }
};

export const digitalReceiptPaymentDetails = async (
  methods: PhysicalReceiptPaymentDetails,
): Promise<any> => {
  await getAuthenticatedUser();

  const validated = physicalReceiptPaymentDetailsSchema.safeParse(methods);

  if (!validated.success) {
    const errors = validated.error.errors.map((err) => {
      const path = err.path.join(".");
      return path ? `${path}: ${err.message}` : err.message;
    });

    throw new Error(`Validation failed: ${errors.join("; ")}`);
  }

  const payload = validated.data;
  console.log("The payload", payload);

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();

    const digitalReceipt = await apiClient.post(
      `/api/digital-receipt-payment-details/${location?.id}/create`,
      payload,
    );
    return parseStringify(digitalReceipt);
  } catch (error) {
    console.error("Failed to store digital receipt payment details:", error);
    throw error;
  }
};

export const resetLocationSettings = async (locationId: string): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/locations/${locationId}/settings/reset`, {});
    revalidatePath("/settings");
    return { responseType: "success", message: "Settings reset to defaults" };
  } catch (error) {
    return { responseType: "error", message: "Failed to reset settings", error: error instanceof Error ? error : new Error(String(error)) };
  }
};
