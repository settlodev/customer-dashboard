"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { Permission, PermissionListResponse } from "@/types/permissions/type";
import { FormResponse } from "@/types/types";

// ---------------------------------------------------------------------------
// List (grouped by category)
// ---------------------------------------------------------------------------

export const fetchAllPermissions = async (
  category?: string,
  systemOnly?: boolean,
): Promise<PermissionListResponse> => {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (systemOnly !== undefined) params.append("systemOnly", String(systemOnly));
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await apiClient.get(`/api/v1/permissions${query}`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Get by ID / Key
// ---------------------------------------------------------------------------

export const getPermission = async (id: string): Promise<Permission> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/permissions/${id}`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const getPermissionByKey = async (key: string): Promise<Permission> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/permissions/by-key/${encodeURIComponent(key)}`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const getPermissionCategories = async (): Promise<string[]> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/permissions/categories`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Filtered lists
// ---------------------------------------------------------------------------

export const getPosPermissions = async (): Promise<Permission[]> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/permissions/pos`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const getDashboardPermissions = async (): Promise<Permission[]> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/permissions/dashboard`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const getPermissionDefaults = async (): Promise<Record<string, Permission[]>> => {
  try {
    const apiClient = new ApiClient();
    apiClient.isPlain = true;
    const data = await apiClient.get(`/api/v1/permissions/defaults`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Create custom permission
// ---------------------------------------------------------------------------

export const createPermission = async (data: {
  key: string;
  name: string;
  description?: string;
}): Promise<FormResponse<Permission>> => {
  try {
    const apiClient = new ApiClient();
    const response = await apiClient.post(`/api/v1/permissions`, data);
    return {
      responseType: "success",
      message: "Permission created",
      data: parseStringify(response),
    };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to create permission",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};
