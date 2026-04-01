"use server";

import { UUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import * as z from "zod";

import { Role } from "@/types/roles/type";
import { ApiResponse, FormResponse } from "@/types/types";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { RoleSchema } from "@/types/roles/schema";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";

export const fetchAllRoles = async (): Promise<Role[]> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    const rolesData = await apiClient.get(`/api/v1/roles`);

    return parseStringify(rolesData);
  } catch (error) {
    throw error;
  }
};

export const searchRoles = async (
  q: string,
  page: number,
  pageLimit: number,
): Promise<ApiResponse<Role>> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    const params = new URLSearchParams({
      search: q,
      page: String(page ? page - 1 : 0),
      size: String(pageLimit ? pageLimit : 10),
    });

    const rolesData = await apiClient.get(`/api/v1/roles?${params.toString()}`);

    return parseStringify(rolesData);
  } catch (error) {
    throw error;
  }
};

export const createRole = async (
  role: z.infer<typeof RoleSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;

  const validatedData = RoleSchema.safeParse(role);

  if (!validatedData.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill in all the fields marked with * before proceeding",
      error: new Error(validatedData.error.message),
    };

    return parseStringify(formResponse);
  }

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    console.log("validatedData.data: ", validatedData.data);
    const payload = {
      ...validatedData.data,
      location: location?.id,
    };

    await apiClient.post(`/api/v1/roles`, payload);
    formResponse = {
      responseType: "success",
      message: "Role created successfully",
    };
  } catch (error: unknown) {
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  revalidatePath("/roles");
  return parseStringify(formResponse);
};

export const updateRole = async (
  id: UUID,
  role: z.infer<typeof RoleSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;

  const validatedData = RoleSchema.safeParse(role);

  if (!validatedData.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill in all the fields marked with * before proceeding",
      error: new Error(validatedData.error.message),
    };

    return parseStringify(formResponse);
  }

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();

    const payload = {
      ...validatedData.data,
      location: location?.id,
    };

    console.log("The payload passed is", payload);

    await apiClient.put(`/api/v1/roles/${id}`, payload);

    formResponse = {
      responseType: "success",
      message: "Role updated successfully",
    };
  } catch (error: unknown) {
    console.log("Error occuring during updating role ", error);
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  revalidatePath("/roles");
  return parseStringify(formResponse);
};

export const getRole = async (id: UUID): Promise<ApiResponse<Role>> => {
  const apiClient = new ApiClient();

  const roleData = await apiClient.get(`/api/v1/roles/${id}`);

  return parseStringify(roleData);
};

export const deleteRole = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("Role ID is required to perform this request");
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    await apiClient.delete(`/api/v1/roles/${id}`);
    revalidatePath("/roles");
  } catch (error) {
    throw error;
  }
};

export const addPermissionsToRole = async (roleId: string, permissionIds: string[]): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/roles/${roleId}/permissions`, { permissionIds });
    revalidatePath("/roles");
    return { responseType: "success", message: "Permissions added successfully" };
  } catch (error) {
    return { responseType: "error", message: "Failed to add permissions", error: error instanceof Error ? error : new Error(String(error)) };
  }
};

export const removePermissionsFromRole = async (roleId: string, permissionIds: string[]): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(`/api/v1/roles/${roleId}/permissions`, { data: { permissionIds } });
    revalidatePath("/roles");
    return { responseType: "success", message: "Permissions removed successfully" };
  } catch (error) {
    return { responseType: "error", message: "Failed to remove permissions", error: error instanceof Error ? error : new Error(String(error)) };
  }
};
