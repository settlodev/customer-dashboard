"use server";
import { ApiResponse, FormResponse } from "@/types/types";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { Device } from "@/types/device/type";
import { UUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { DeviceSchema } from "@/types/device/schema";
import { z } from "zod";

export const searchDevices = async (
  q: string,
  page: number,
  pageLimit: number,
): Promise<ApiResponse<Device>> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    const query = {
      filters: [
        {
          key: "name",
          operator: "LIKE",
          field_type: "STRING",
          value: q,
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

export const createDevice = async (
  discount: z.infer<typeof DeviceSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;

  const discountValidData = DeviceSchema.safeParse(discount);

  if (!discountValidData.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(discountValidData.error.message),
    };
    return parseStringify(formResponse);
  }

  const location = await getCurrentLocation();

  const payload = {
    ...discountValidData.data,
    location: location?.id,
  };
  try {
    const apiClient = new ApiClient();

    await apiClient.post(`/api/discounts/${location?.id}/create`, payload);
    formResponse = {
      responseType: "success",
      message: "Device created successfully",
    };
  } catch (error) {
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  revalidatePath("/discounts");
  return parseStringify(formResponse);
};

export const updateDevice = async (
  id: UUID,
  device: z.infer<typeof DeviceSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;
  const validData = DeviceSchema.safeParse(device);

  if (!validData.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validData.error.message),
    };
    return parseStringify(formResponse);
  }

  const location = await getCurrentLocation();
  const payload = {
    ...validData.data,
    location: location?.id,
  };

  try {
    const apiClient = new ApiClient();

    await apiClient.put(`/api/discounts/${location?.id}/${id}`, payload);

    formResponse = {
      responseType: "success",
      message: "Device updated successfully",
    };
  } catch (error) {
    console.error("Error updating discount", error);
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  revalidatePath("/discounts");
  return parseStringify(formResponse);
};

export const getDevice = async (id: UUID): Promise<ApiResponse<Device>> => {
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
  const location = await getCurrentLocation();
  const deviceResponse = await apiClient.post(
    `/api/discounts/${location?.id}`,
    query,
  );

  return parseStringify(deviceResponse);
};

export const generateDeviceToken = async (
  discount: z.infer<typeof DeviceSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;

  const deviceValidData = DeviceSchema.safeParse(discount);

  if (!deviceValidData.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(deviceValidData.error.message),
    };
    return parseStringify(formResponse);
  }

  const location = await getCurrentLocation();

  const payload = {
    ...deviceValidData.data,
    locationId: location?.id,
  };
  console.log("The payload is", payload);
  try {
    const apiClient = new ApiClient();

    console.time("API Request Duration");
    const response = await apiClient.post(
      "/auth/api/token/generate/location-device/new",
      payload,
    );
    console.timeEnd("API Request Duration");
    console.log("The response from server is", response);
    formResponse = {
      responseType: "success",
      message: "Device Token generated successfully",
    };
  } catch (error) {
    console.log("Error not formatted", error);
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
    console.log("The error displayed from from response is", formResponse);
  }

  revalidatePath("/devices");
  return parseStringify(formResponse);
};
