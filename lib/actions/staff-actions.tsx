"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import {
  Staff,
  StaffCount,
  StaffDetail,
  StaffListEnriched,
  StaffSchema,
  StaffSummaryReport,
} from "@/types/staff";
import { ApiResponse, FormResponse } from "@/types/types";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import {
  getCurrentBusiness,
  getCurrentLocation,
} from "./business/get-current-business";
import { inviteStaffToBusiness } from "./emails/send";

// ---------------------------------------------------------------------------
// List / Search
// ---------------------------------------------------------------------------

export const fetchStaffPage = async (
  page: number = 0,
  size: number = 20,
): Promise<ApiResponse<Staff>> => {
  await getAuthenticatedUser();
  const apiClient = new ApiClient();
  const location = await getCurrentLocation();
  const params = new URLSearchParams();
  if (location?.id) params.append("locationId", location.id);
  params.append("page", String(page));
  params.append("size", String(size));
  params.append("sort", "firstName,asc");
  const data = await apiClient.get(`/api/v1/staff?${params.toString()}`);
  return parseStringify(data);
};

export const fetchAllStaff = async (): Promise<Staff[]> => {
  const response = await fetchStaffPage(0, 500);
  return response.content ?? [];
};

export const getActiveStaff = async (): Promise<Staff[]> => {
  await getAuthenticatedUser();
  const apiClient = new ApiClient();
  const location = await getCurrentLocation();
  if (!location?.id) return [];
  const data = await apiClient.get(`/api/v1/staff/active?locationId=${location.id}`);
  return parseStringify(data);
};

export const searchStaffByName = async (query: string): Promise<Staff[]> => {
  await getAuthenticatedUser();
  const apiClient = new ApiClient();
  const location = await getCurrentLocation();
  const params = new URLSearchParams({ query });
  if (location?.id) params.append("locationId", location.id);
  const data = await apiClient.get(`/api/v1/staff/search?${params.toString()}`);
  return parseStringify(data);
};

// ---------------------------------------------------------------------------
// Get
// ---------------------------------------------------------------------------

/**
 * Resolve the current user's own staff record, if they have one.
 *
 * Returns null when the authenticated user is a dashboard-only
 * principal without a linked StaffEntity — e.g. an external auditor
 * invited as an AccountMember, or an internal platform operator. The
 * profile page uses this to decide whether to show staff-only self-service
 * controls (like the POS PIN card).
 */
export const getMyStaff = async (): Promise<Staff | null> => {
  await getAuthenticatedUser();
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/staff/me`);
    // Backend returns 204 No Content when the user has no staff record.
    // ApiClient surfaces that as an empty/undefined body — treat as null.
    if (!data || typeof data !== "object") return null;
    return parseStringify(data) as Staff;
  } catch {
    return null;
  }
};

export const getStaff = async (id: string): Promise<Staff> => {
  const apiClient = new ApiClient();
  const data = await apiClient.get(`/api/v1/staff/${id}`);
  return parseStringify(data);
};

export const getStaffDetail = async (id: string): Promise<StaffDetail> => {
  const apiClient = new ApiClient();
  const location = await getCurrentLocation();
  const params = location?.id ? `?locationId=${location.id}` : "";
  const data = await apiClient.get(`/api/v1/staff/${id}/detail${params}`);
  return parseStringify(data);
};

export const getEnrichedStaff = async (
  page: number = 0,
  size: number = 20,
): Promise<ApiResponse<StaffListEnriched>> => {
  await getAuthenticatedUser();
  const apiClient = new ApiClient();
  const location = await getCurrentLocation();
  const params = new URLSearchParams();
  if (location?.id) params.append("locationId", location.id);
  params.append("page", String(page));
  params.append("size", String(size));
  const data = await apiClient.get(`/api/v1/staff/enriched?${params.toString()}`);
  return parseStringify(data);
};

// ---------------------------------------------------------------------------
// Count
// ---------------------------------------------------------------------------

export const getStaffCount = async (): Promise<StaffCount> => {
  const apiClient = new ApiClient();
  const data = await apiClient.get(`/api/v1/staff/count`);
  return parseStringify(data);
};

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export const createStaff = async (
  staff: z.infer<typeof StaffSchema>,
): Promise<FormResponse | void> => {
  const validatedData = StaffSchema.safeParse(staff);
  if (!validatedData.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill in all required fields",
      error: new Error(validatedData.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const business = await getCurrentBusiness();

    if (!location?.id) {
      return parseStringify({
        responseType: "error",
        message: "No current location selected",
        error: new Error("locationId missing"),
      });
    }

    const { pin, password, ...fields } = validatedData.data;
    const payload: Record<string, unknown> = {
      ...fields,
      locationId: location.id,
    };
    if (fields.dateOfBirth) payload.dateOfBirth = fields.dateOfBirth.toISOString().split("T")[0];
    if (fields.joiningDate) payload.joiningDate = fields.joiningDate.toISOString().split("T")[0];
    if (pin) payload.pin = pin;
    if (fields.dashboardAccess && password) payload.password = password;

    const created = (await apiClient.post(`/api/v1/staff`, payload)) as Staff;

    if (created.dashboardAccess && created.email && business?.id) {
      try {
        await sendInvitation(created.id, business.id);
      } catch {
        // Staff created but invitation email failed — not fatal
      }
    }

    revalidatePath("/staff");
    return parseStringify({ responseType: "success", message: "Staff created successfully" });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to create staff",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
};

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export const updateStaff = async (
  id: string,
  staff: z.infer<typeof StaffSchema>,
): Promise<FormResponse | void> => {
  const validatedData = StaffSchema.safeParse(staff);
  if (!validatedData.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill in all required fields",
      error: new Error(validatedData.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { pin, password, posAccess, dashboardAccess, ...fields } = validatedData.data;
    const payload: Record<string, unknown> = { ...fields };
    if (fields.dateOfBirth) payload.dateOfBirth = fields.dateOfBirth.toISOString().split("T")[0];
    if (fields.joiningDate) payload.joiningDate = fields.joiningDate.toISOString().split("T")[0];

    await apiClient.put(`/api/v1/staff/${id}`, payload);

    revalidatePath("/staff");
    revalidatePath(`/staff/${id}`);
    return parseStringify({ responseType: "success", message: "Staff updated successfully" });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update staff",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
};

// ---------------------------------------------------------------------------
// Deactivate / Reactivate
// ---------------------------------------------------------------------------

export const deactivateStaff = async (id: string): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/staff/${id}/deactivate`, {});
    revalidatePath("/staff");
    return { responseType: "success", message: "Staff deactivated successfully" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message || "Failed to deactivate staff",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const reactivateStaff = async (id: string): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/staff/${id}/reactivate`, {});
    revalidatePath("/staff");
    return { responseType: "success", message: "Staff reactivated successfully" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message || "Failed to reactivate staff",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

// ---------------------------------------------------------------------------
// Dashboard Access
// ---------------------------------------------------------------------------

export const grantDashboardAccess = async (
  staffId: string,
  email: string,
  password: string,
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    const result = await apiClient.post(`/api/v1/staff/${staffId}/dashboard-access`, {
      email,
      password,
    });

    const business = await getCurrentBusiness();
    if (business?.id) {
      try {
        const staffData = result as any;
        if (staffData?.passwordResetToken && email) {
          await inviteStaffToBusiness(staffData.passwordResetToken, email);
        }
      } catch {
        // Invitation email failed — not fatal
      }
    }

    revalidatePath("/staff");
    return { responseType: "success", message: "Dashboard access granted" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message || "Failed to grant dashboard access",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const revokeDashboardAccess = async (staffId: string): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(`/api/v1/staff/${staffId}/dashboard-access`);
    revalidatePath("/staff");
    return { responseType: "success", message: "Dashboard access revoked" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message || "Failed to revoke dashboard access",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

// ---------------------------------------------------------------------------
// POS Access
// ---------------------------------------------------------------------------

export const grantPosAccess = async (staffId: string): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/staff/${staffId}/pos-access`, {});
    revalidatePath("/staff");
    return { responseType: "success", message: "POS access granted" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message || "Failed to grant POS access",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const revokePosAccess = async (staffId: string): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(`/api/v1/staff/${staffId}/pos-access`);
    revalidatePath("/staff");
    return { responseType: "success", message: "POS access revoked" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message || "Failed to revoke POS access",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

// ---------------------------------------------------------------------------
// POS PIN Management
// ---------------------------------------------------------------------------
//
// Staff POS PINs live on the Accounts Service (not Auth) now — the paired
// device pulls the hash via the internal staff-sync endpoint and verifies
// PINs locally so staff switches don't need a server round-trip.
//
// Three entry points below:
//   - setStaffPin(staffId, pin)   — admin sets/rotates another staff's PIN
//   - clearStaffPin(staffId)      — admin clears a PIN (e.g. staff left)
//   - setMyPin(pin)               — authenticated staff rotates their own PIN
//
// PIN is 4-6 digits; client-side validation mirrors the server so we fail
// fast without a round-trip on obvious input errors.

const PIN_PATTERN = /^\d{4,6}$/;

const validatePin = (pin: string): string | null => {
  if (!pin || !PIN_PATTERN.test(pin)) {
    return "PIN must be 4 to 6 digits";
  }
  return null;
};

export const setStaffPin = async (
  staffId: string,
  pin: string,
): Promise<FormResponse> => {
  const validationError = validatePin(pin);
  if (validationError) {
    return { responseType: "error", message: validationError, error: new Error(validationError) };
  }
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/staff/${staffId}/pin`, { pin });
    revalidatePath(`/staff/${staffId}`);
    return { responseType: "success", message: "PIN updated" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message || "Failed to update PIN",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const clearStaffPin = async (staffId: string): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(`/api/v1/staff/${staffId}/pin`);
    revalidatePath(`/staff/${staffId}`);
    return { responseType: "success", message: "PIN cleared" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message || "Failed to clear PIN",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const setMyPin = async (pin: string): Promise<FormResponse> => {
  const validationError = validatePin(pin);
  if (validationError) {
    return { responseType: "error", message: validationError, error: new Error(validationError) };
  }
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/staff/me/pin`, { pin });
    revalidatePath(`/profile`);
    return { responseType: "success", message: "PIN updated" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message || "Failed to update PIN",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

// ---------------------------------------------------------------------------
// Role Assignment
// ---------------------------------------------------------------------------

export const assignStaffRoles = async (
  staffId: string,
  roleIds: string[],
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/staff/${staffId}/roles`, { roleIds });
    revalidatePath("/staff");
    revalidatePath(`/staff/${staffId}`);
    return { responseType: "success", message: "Roles assigned successfully" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message || "Failed to assign roles",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export const staffReport = async (
  startDate?: Date,
  endDate?: Date,
): Promise<StaffSummaryReport | null> => {
  await getAuthenticatedUser();
  try {
    const apiClient = new ApiClient("reports");
    const location = await getCurrentLocation();
    const params: Record<string, unknown> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const report = await apiClient.get(`/api/reports/${location?.id}/staff/summary`, { params });
    return parseStringify(report);
  } catch (error: any) {
    throw new Error(error?.message || "Failed to fetch staff report");
  }
};

// ---------------------------------------------------------------------------
// Internal: invitation email
// ---------------------------------------------------------------------------

const sendInvitation = async (staffId: string, businessId: string): Promise<void> => {
  const apiClient = new ApiClient();
  const result: any = await apiClient.post(`/api/v1/staff/${staffId}/dashboard-access`, {
    staff: staffId,
    business: businessId,
  });
  if (result?.passwordResetToken && result?.staffEmail) {
    await inviteStaffToBusiness(result.passwordResetToken, result.staffEmail);
  }
};
