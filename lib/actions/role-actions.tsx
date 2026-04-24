"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { Role, RoleScope } from "@/types/roles/type";
import { RoleSchema } from "@/types/roles/schema";
import { FormResponse } from "@/types/types";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import {
  getCurrentBusiness,
  getCurrentLocation,
} from "@/lib/actions/business/get-current-business";

// ---------------------------------------------------------------------------
// Scope resolution
// ---------------------------------------------------------------------------

// Resolve the scopeId the backend expects for a given scope from the current
// business/location context cookies. ACCOUNT scope must have null scopeId;
// STORE/WAREHOUSE require the caller to pass one explicitly since there is
// no current-store/current-warehouse cookie.
async function resolveScopeId(
  scope: RoleScope,
  explicitScopeId?: string,
): Promise<string | null> {
  if (scope === RoleScope.ACCOUNT) return null;
  if (explicitScopeId) return explicitScopeId;

  if (scope === RoleScope.LOCATION) {
    const location = await getCurrentLocation();
    if (!location?.id) throw new Error("No current location selected for LOCATION-scoped role");
    return location.id;
  }

  if (scope === RoleScope.BUSINESS) {
    const business = await getCurrentBusiness();
    if (!business?.id) throw new Error("No current business selected for BUSINESS-scoped role");
    return business.id;
  }

  throw new Error(`scopeId is required for ${scope}-scoped role`);
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export const fetchAllRoles = async (
  scope?: RoleScope,
  scopeId?: string,
): Promise<Role[]> => {
  await getAuthenticatedUser();
  const apiClient = new ApiClient();
  const params = new URLSearchParams();
  if (scope) params.append("scope", scope);
  if (scopeId) params.append("scopeId", scopeId);
  const query = params.toString() ? `?${params.toString()}` : "";
  const data = await apiClient.get(`/api/v1/roles${query}`);
  return parseStringify(data);
};

export const getRolesByScope = async (
  scope: RoleScope,
  scopeId?: string,
): Promise<Role[]> => {
  await getAuthenticatedUser();
  const apiClient = new ApiClient();
  const query = scopeId ? `?scopeId=${scopeId}` : "";
  const data = await apiClient.get(`/api/v1/roles/by-scope/${scope}${query}`);
  return parseStringify(data);
};

// ---------------------------------------------------------------------------
// Get
// ---------------------------------------------------------------------------

export const getRole = async (id: string): Promise<Role> => {
  const apiClient = new ApiClient();
  const data = await apiClient.get(`/api/v1/roles/${id}`);
  return parseStringify(data);
};

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export const createRole = async (
  role: z.infer<typeof RoleSchema>,
): Promise<FormResponse | void> => {
  const validatedData = RoleSchema.safeParse(role);
  if (!validatedData.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill in all required fields",
      error: new Error(validatedData.error.message),
    });
  }

  try {
    const scopeId = await resolveScopeId(
      validatedData.data.scope,
      validatedData.data.scopeId,
    );

    const payload = {
      name: validatedData.data.name,
      description: validatedData.data.description,
      scope: validatedData.data.scope,
      scopeId,
      permissionKeys: validatedData.data.permissionKeys ?? [],
    };

    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/roles`, payload);
    revalidatePath("/roles");
    return parseStringify({ responseType: "success", message: "Role created successfully" });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to create role",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
};

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export const updateRole = async (
  id: string,
  role: z.infer<typeof RoleSchema>,
): Promise<FormResponse | void> => {
  const validatedData = RoleSchema.safeParse(role);
  if (!validatedData.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill in all required fields",
      error: new Error(validatedData.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();
    const payload = {
      name: validatedData.data.name,
      description: validatedData.data.description,
      permissionKeys: validatedData.data.permissionKeys ?? [],
    };
    await apiClient.put(`/api/v1/roles/${id}`, payload);
    revalidatePath("/roles");
    revalidatePath(`/roles/${id}`);
    return parseStringify({ responseType: "success", message: "Role updated successfully" });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update role",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
};

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export const deleteRole = async (id: string): Promise<void> => {
  await getAuthenticatedUser();
  const apiClient = new ApiClient();
  await apiClient.delete(`/api/v1/roles/${id}`);
  revalidatePath("/roles");
};

// ---------------------------------------------------------------------------
// Permission management on roles
// ---------------------------------------------------------------------------

export const assignPermissionsToRole = async (
  roleId: string,
  permissionKeys: string[],
  additive: boolean = false,
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/roles/${roleId}/permissions`, { permissionKeys, additive });
    revalidatePath("/roles");
    revalidatePath(`/roles/${roleId}`);
    return { responseType: "success", message: "Permissions updated" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to update permissions",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const removePermissionsFromRole = async (
  roleId: string,
  permissionKeys: string[],
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(`/api/v1/roles/${roleId}/permissions`, { data: permissionKeys });
    revalidatePath("/roles");
    revalidatePath(`/roles/${roleId}`);
    return { responseType: "success", message: "Permissions removed" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to remove permissions",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};
