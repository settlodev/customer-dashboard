"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import {
  CreateInternalUserRequest,
  InternalUserResponse,
  RolePermissionsResponse,
  UpdateInternalRolesRequest,
} from "@/types/admin/internal-user";
import {
  InternalStaffSummary,
  UpdateInternalStaffRequest,
} from "@/types/admin/internal-staff";
import {
  CreateInternalUserSchema,
  UpdateInternalRolesSchema,
  UpdateInternalStaffSchema,
} from "@/types/admin/schemas";

const INTERNAL_USERS_PATH = "/api/v1/admin/internal-users";

function staffClient() {
  return new ApiClient("auth", "staff");
}

function accountsClient() {
  return new ApiClient("accounts", "staff");
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

export async function updateInternalUserRoles(
  userId: string,
  payload: z.infer<typeof UpdateInternalRolesSchema>,
): Promise<FormResponse<InternalUserResponse>> {
  const validated = UpdateInternalRolesSchema.safeParse(payload);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Select at least one role to assign",
      error: new Error(validated.error.message),
    });
  }

  try {
    const body: UpdateInternalRolesRequest = validated.data;
    const updated = await staffClient().patch<
      InternalUserResponse,
      UpdateInternalRolesRequest
    >(`${INTERNAL_USERS_PATH}/${userId}/roles`, body);

    revalidatePath("/admin/users");
    return parseStringify({
      responseType: "success",
      message: "Roles updated",
      data: updated,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update roles",
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

// ── Internal staff profiles (rich detail, Accounts Service) ─────────
//
// The Auth-driven internal user (above) carries only identity (email/role/
// status). The matching InternalStaffProfile in the Accounts Service holds the
// name + HRM-seed details, keyed by authUserId. The management page overlays
// these onto the Auth list, and edits target the Accounts profile by its own id.

export async function listInternalStaffProfiles(): Promise<
  InternalStaffSummary[]
> {
  const data = await accountsClient().get<ApiResponse<InternalStaffSummary>>(
    "/api/v1/admin/internal-staff/all?page=0&size=500&sort=createdAt,desc",
  );
  return parseStringify(data?.content ?? []);
}

export async function updateInternalStaffDetails(
  profileId: string,
  payload: z.infer<typeof UpdateInternalStaffSchema>,
): Promise<FormResponse<InternalStaffSummary>> {
  const validated = UpdateInternalStaffSchema.safeParse(payload);
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
    const { firstName, lastName, phoneNumber, jobTitle, joiningDate, notes } =
      validated.data;
    // Empty string clears phone/jobTitle/notes server-side; joiningDate is
    // omitted when blank (a LocalDate can't parse "") so it's left unchanged.
    const body: UpdateInternalStaffRequest = {
      firstName,
      lastName,
      phoneNumber: phoneNumber ?? "",
      jobTitle: jobTitle ?? "",
      notes: notes ?? "",
      ...(joiningDate ? { joiningDate } : {}),
    };

    const updated = await accountsClient().patch<
      InternalStaffSummary,
      UpdateInternalStaffRequest
    >(`/api/v1/admin/internal-staff/${profileId}`, body);

    revalidatePath("/admin/users");
    return parseStringify({
      responseType: "success",
      message: "Staff details updated",
      data: updated,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update staff details",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
