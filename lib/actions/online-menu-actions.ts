"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import { getCurrentLocation } from "./business/get-current-business";
import { OnlineMenu, MenuSettings } from "@/types/online-menu/type";
import { OnlineMenuSchema, MenuSettingsSchema } from "@/types/online-menu/schema";
import { UUID } from "node:crypto";
import { FormResponse } from "@/types/types";

const MAX_MENUS_PER_LOCATION = 5;

export const fetchOnlineMenus = async (): Promise<OnlineMenu[]> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const data = await apiClient.get<OnlineMenu[]>(
      `/api/online-menus/${location?.id}`,
    );
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const fetchOnlineMenu = async (id: UUID): Promise<OnlineMenu> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const data = await apiClient.get<OnlineMenu>(
      `/api/online-menus/${location?.id}/${id}`,
    );
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const createOnlineMenu = async (
  menu: z.infer<typeof OnlineMenuSchema>,
): Promise<FormResponse & { data?: OnlineMenu }> => {
  await getAuthenticatedUser();

  const validated = OnlineMenuSchema.safeParse(menu);
  if (!validated.success) {
    return {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    };
  }

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();

    // Check menu limit
    const existingMenus = await apiClient.get<OnlineMenu[]>(
      `/api/online-menus/${location?.id}`,
    );
    if (existingMenus && existingMenus.length >= MAX_MENUS_PER_LOCATION) {
      return {
        responseType: "error",
        message: `You can only have up to ${MAX_MENUS_PER_LOCATION} menus per location`,
      };
    }

    const data = await apiClient.post<OnlineMenu, z.infer<typeof OnlineMenuSchema>>(
      `/api/online-menus/${location?.id}/create`,
      validated.data,
    );
    return {
      responseType: "success",
      message: "Menu created successfully",
      data: parseStringify(data),
    };
  } catch (error) {
    return {
      responseType: "error",
      message: "Something went wrong while creating the menu, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const updateOnlineMenu = async (
  id: UUID,
  menu: z.infer<typeof OnlineMenuSchema>,
): Promise<FormResponse & { data?: OnlineMenu }> => {
  await getAuthenticatedUser();

  const validated = OnlineMenuSchema.safeParse(menu);
  if (!validated.success) {
    return {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    };
  }

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const data = await apiClient.put<OnlineMenu, z.infer<typeof OnlineMenuSchema>>(
      `/api/online-menus/${location?.id}/${id}`,
      validated.data,
    );
    return {
      responseType: "success",
      message: "Menu updated successfully",
      data: parseStringify(data),
    };
  } catch (error) {
    return {
      responseType: "error",
      message: "Something went wrong while updating the menu, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const deleteOnlineMenu = async (
  id: UUID,
): Promise<FormResponse> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    await apiClient.delete(`/api/online-menus/${location?.id}/${id}`);
    return {
      responseType: "success",
      message: "Menu deleted successfully",
    };
  } catch (error) {
    return {
      responseType: "error",
      message: "Something went wrong while deleting the menu, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const generateQrCode = async (
  id: UUID,
): Promise<FormResponse & { data?: OnlineMenu }> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const data = await apiClient.post<OnlineMenu, Record<string, never>>(
      `/api/online-menus/${location?.id}/${id}/generate-qr-code`,
      {},
    );
    return {
      responseType: "success",
      message: "QR code generated successfully",
      data: parseStringify(data),
    };
  } catch (error) {
    return {
      responseType: "error",
      message: "Something went wrong while generating the QR code",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const fetchMenuSettings = async (
  onlineMenuId: UUID,
): Promise<MenuSettings> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get<MenuSettings>(
      `/api/menu-settings/${onlineMenuId}`,
    );
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const updateMenuSettings = async (
  onlineMenuId: UUID,
  settings: z.infer<typeof MenuSettingsSchema>,
): Promise<FormResponse> => {
  await getAuthenticatedUser();

  const validated = MenuSettingsSchema.safeParse(settings);
  if (!validated.success) {
    return {
      responseType: "error",
      message: "Invalid settings data",
      error: new Error(validated.error.message),
    };
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.put(
      `/api/menu-settings/${onlineMenuId}`,
      validated.data,
    );
    return {
      responseType: "success",
      message: "Menu settings updated successfully",
    };
  } catch (error) {
    return {
      responseType: "error",
      message: "Something went wrong while updating settings, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};
