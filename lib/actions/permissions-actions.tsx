"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { Permission } from "@/types/permissions/type";

export const fetchAllPermissions = async (
  category?: string,
  systemOnly?: boolean,
): Promise<Permission[]> => {
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

export const getPermission = async (id: string): Promise<Permission> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/permissions/${id}`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const getPermissionCategories = async (): Promise<string[]> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/permissions/categories`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

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

export const getPermissionDefaults = async (): Promise<Permission[]> => {
  try {
    const apiClient = new ApiClient();
    apiClient.isPlain = true;
    const data = await apiClient.get(`/api/v1/permissions/defaults`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};
