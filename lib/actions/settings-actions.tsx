"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UUID } from "node:crypto";
import {
  getCurrentBusiness,
  getCurrentLocation,
} from "./business/get-current-business";
import { NotificationSettingsSchema } from "@/types/notification/shema";
import { LocationSettingsSchema } from "@/types/settings/schema";
import { LocationSettings } from "@/types/settings/type";

export const fetchLocationSettings = async (): Promise<LocationSettings> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();

    const settingsData = await apiClient.get(
      `/api/location-settings/${location?.id}`,
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
  const payload = {
    ...validSettingsData.data,
    locationId: locationId?.id,
  };

  console.log("payload", payload);
  try {
    const apiClient = new ApiClient();

    await apiClient.put(
      `/api/location-settings/${locationId?.id}/${id}`,
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
  redirect("/settings");
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
  const businessId = await getCurrentBusiness();
  const payload = {
    ...validNotificationSetting.data,
  };

  console.log("The payload", payload);

  try {
    const apiClient = new ApiClient();

    await apiClient.put(
      `/api/locations/${businessId?.id}/update-notifications/${locationId?.id}`,
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

export const acceptOrderPaymentMethods = async (): Promise<any> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();

    const orderPaymentMethods = await apiClient.get(
      `/api/${location?.id}/accepted-payment-methods/order-transactions/all`,
    );
    return parseStringify(orderPaymentMethods);
  } catch (error) {
    throw error;
  }
};
