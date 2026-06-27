"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import {
  CreateInternalRoleRequest,
  InternalRoleResponse,
  UpdateInternalRoleDefinitionRequest,
} from "@/types/admin/internal-role";
import {
  CreateInternalRoleSchema,
  UpdateInternalRoleDefinitionSchema,
} from "@/types/admin/schemas";

const ROLES_PATH = "/api/v1/admin/internal-roles";

function staffClient() {
  return new ApiClient("auth", "staff");
}

export async function listInternalRoleDefinitions(): Promise<
  InternalRoleResponse[]
> {
  const data = await staffClient().get<InternalRoleResponse[]>(ROLES_PATH);
  return parseStringify(data);
}

export async function listPermissionCatalog(): Promise<string[]> {
  const data = await staffClient().get<string[]>(`${ROLES_PATH}/permissions`);
  return parseStringify(data);
}

export async function createInternalRole(
  payload: z.infer<typeof CreateInternalRoleSchema>,
): Promise<FormResponse<InternalRoleResponse>> {
  const validated = CreateInternalRoleSchema.safeParse(payload);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: validated.error.errors[0]?.message ?? "Check the role details",
      error: new Error(validated.error.message),
    });
  }
  try {
    const { code, name, description, assignableAs, permissions } =
      validated.data;
    const body: CreateInternalRoleRequest = {
      code,
      name,
      description: description || undefined,
      assignableAs: assignableAs || undefined,
      permissions,
    };
    const created = await staffClient().post<
      InternalRoleResponse,
      CreateInternalRoleRequest
    >(ROLES_PATH, body);
    revalidatePath("/admin/roles");
    return parseStringify({
      responseType: "success",
      message: "Role created",
      data: created,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to create role",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function updateInternalRole(
  roleId: string,
  payload: z.infer<typeof UpdateInternalRoleDefinitionSchema>,
): Promise<FormResponse<InternalRoleResponse>> {
  const validated = UpdateInternalRoleDefinitionSchema.safeParse(payload);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: validated.error.errors[0]?.message ?? "Check the role details",
      error: new Error(validated.error.message),
    });
  }
  try {
    const { name, description, assignableAs, permissions, active } =
      validated.data;
    const body: UpdateInternalRoleDefinitionRequest = {
      name,
      description: description || undefined,
      assignableAs: assignableAs || undefined,
      permissions,
      active,
    };
    const updated = await staffClient().patch<
      InternalRoleResponse,
      UpdateInternalRoleDefinitionRequest
    >(`${ROLES_PATH}/${roleId}`, body);
    revalidatePath("/admin/roles");
    return parseStringify({
      responseType: "success",
      message: "Role updated",
      data: updated,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update role",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function deactivateInternalRole(
  roleId: string,
): Promise<FormResponse<void>> {
  try {
    await staffClient().post<void, Record<string, never>>(
      `${ROLES_PATH}/${roleId}/deactivate`,
      {},
    );
    revalidatePath("/admin/roles");
    return parseStringify({
      responseType: "success",
      message: "Role deactivated",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to deactivate role",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
