"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import {
  CreateInternalUserRequest,
  InternalUserResponse,
  RolePermissionsResponse,
  UpdateInternalRoleRequest,
} from "@/types/admin/internal-user";
import {
  CreateInternalUserSchema,
  UpdateInternalRoleSchema,
} from "@/types/admin/schemas";

const INTERNAL_USERS_PATH = "/api/v1/admin/internal-users";

function staffClient() {
  return new ApiClient("auth", "staff");
}

export async function listInternalUsers(): Promise<InternalUserResponse[]> {
  const data = await staffClient().get<InternalUserResponse[]>(
    INTERNAL_USERS_PATH,
  );
  return parseStringify(data);
}

export async function getInternalUser(
  userId: string,
): Promise<InternalUserResponse> {
  const data = await staffClient().get<InternalUserResponse>(
    `${INTERNAL_USERS_PATH}/${userId}`,
  );
  return parseStringify(data);
}

export async function listInternalRoles(): Promise<RolePermissionsResponse[]> {
  const data = await staffClient().get<RolePermissionsResponse[]>(
    `${INTERNAL_USERS_PATH}/roles`,
  );
  return parseStringify(data);
}

export async function createInternalUser(
  payload: z.infer<typeof CreateInternalUserSchema>,
): Promise<FormResponse<InternalUserResponse>> {
  const validated = CreateInternalUserSchema.safeParse(payload);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message:
        validated.error.errors[0]?.message ??
        "Please fill all required fields",
      error: new Error(validated.error.message),
    });
  }

  try {
    const body: CreateInternalUserRequest = validated.data;
    const created = await staffClient().post<
      InternalUserResponse,
      CreateInternalUserRequest
    >(INTERNAL_USERS_PATH, body);

    revalidatePath("/admin/users");
    return parseStringify({
      responseType: "success",
      message: "Internal user created",
      data: created,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to create internal user",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function updateInternalUserRole(
  userId: string,
  payload: z.infer<typeof UpdateInternalRoleSchema>,
): Promise<FormResponse<InternalUserResponse>> {
  const validated = UpdateInternalRoleSchema.safeParse(payload);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Select a role to assign",
      error: new Error(validated.error.message),
    });
  }

  try {
    const body: UpdateInternalRoleRequest = validated.data;
    const updated = await staffClient().patch<
      InternalUserResponse,
      UpdateInternalRoleRequest
    >(`${INTERNAL_USERS_PATH}/${userId}/role`, body);

    revalidatePath("/admin/users");
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

export async function deactivateInternalUser(
  userId: string,
): Promise<FormResponse<void>> {
  try {
    await staffClient().delete<void>(`${INTERNAL_USERS_PATH}/${userId}`);
    revalidatePath("/admin/users");
    return parseStringify({
      responseType: "success",
      message: "Internal user deactivated",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to deactivate user",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
