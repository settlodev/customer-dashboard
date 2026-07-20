"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import {
  Staff,
  StaffAuditEvent,
  StaffCount,
  StaffDetail,
  StaffListEnriched,
  StaffSchema,
  StaffSummaryReport,
} from "@/types/staff";
import { ApiResponse, FormResponse } from "@/types/types";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { getCurrentLocation } from "./business/get-current-business";
import { getCurrentDestination } from "./context";

/**
 * Public (unauthenticated) staff invitation context for the set-password
 * landing page. Mirrors getPublicInvitation for account members: fetched by
 * staff id from the Accounts service public endpoint, returns null on any
 * failure so the landing falls back to generic copy.
 */
export interface PublicStaffInvitation {
  firstName: string | null;
  accountName: string | null;
  businessName: string | null;
  roleName: string | null;
}

export const getPublicStaffInvitation = async (
  staffId: string,
): Promise<PublicStaffInvitation | null> => {
  try {
    const base = process.env.ACCOUNTS_SERVICE_URL;
    if (!base) {
      console.warn("getPublicStaffInvitation: ACCOUNTS_SERVICE_URL not configured");
      return null;
    }
    const res = await fetch(
      `${base}/api/v1/public/staff/invitations/${staffId}`,
      { headers: { "Content-Type": "application/json" }, cache: "no-store" },
    );
    if (!res.ok) return null;
    return (await res.json()) as PublicStaffInvitation;
  } catch {
    return null;
  }
};

/**
 * Paginated list of staff.
 */
export const fetchStaffPage = async (
  page: number,
  size: number,
  options: { scope?: "location" | "account" } = {},
): Promise<ApiResponse<Staff>> => {
  const apiClient = new ApiClient();
  const params = new URLSearchParams();
  if (options.scope !== "account") {
    const location = await getCurrentLocation();
    if (location?.id) params.append("locationId", location.id);
  }
  params.append("page", String(page ? page - 1 : 0));
  params.append("size", String(size || 10));
  params.append("sort", "firstName,asc");
  const data = await apiClient.get(`/api/v1/staff?${params.toString()}`);
  return parseStringify(data);
};

export const fetchAllStaff = async (): Promise<Staff[]> => {
  const response = await fetchStaffPage(0, 500);
  return response.content ?? [];
};

export const searchStaffByName = async (query: string): Promise<Staff[]> => {
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
export const getMyStaff = async (): Promise<Staff | null> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/staff/me`);
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
  page: number,
  size: number,
  options: { scope?: "location" | "account" } = {},
): Promise<ApiResponse<StaffListEnriched>> => {
  const apiClient = new ApiClient();
  const params = new URLSearchParams();
  if (options.scope !== "account") {
    const location = await getCurrentLocation();
    if (location?.id) params.append("locationId", location.id);
  }
  params.append("page", String(page ? page - 1 : 0));
  params.append("size", String(size || 10));
  const data = await apiClient.get(
    `/api/v1/staff/enriched?${params.toString()}`,
  );
  return parseStringify(data);
};

export const getStaffAtLocation = async (
  page: number,
  size: number,
  activeFilter?: boolean,
): Promise<ApiResponse<StaffListEnriched>> => {
  const location = await getCurrentLocation();
  if (!location?.id) {
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
    } as unknown as ApiResponse<StaffListEnriched>;
  }
  const apiClient = new ApiClient();
  const params = new URLSearchParams();
  params.append("page", String(page ? page - 1 : 0));
  params.append("size", String(size || 10));
  if (activeFilter !== undefined) {
    params.append("active", String(activeFilter));
  }
  const data = await apiClient.get(
    `/api/v1/staff/by-location/${location.id}?${params.toString()}`,
  );
  return parseStringify(data);
};

export const getStaffCount = async (): Promise<StaffCount> => {
  const apiClient = new ApiClient();
  const data = await apiClient.get(`/api/v1/staff/count`);
  return parseStringify(data);
};

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
    // Register the staff member under the dashboard's active destination —
    // a location, store, or warehouse (precedence warehouse > store >
    // location). This is a cookie/header concept, not a JWT claim, so it
    // must be sent explicitly; the backend validates it owns the entity.
    const destination = await getCurrentDestination();

    if (!destination) {
      return parseStringify({
        responseType: "error",
        message: "Select a location, store, or warehouse first",
        error: new Error("no active destination"),
      });
    }

    // `password` is intentionally NOT forwarded: dashboard access is now
    // passwordless from the dashboard's side — the backend creates the
    // user and emails them a set-password link. We still send email +
    // dashboardAccess + roles + PIN. (Spread excludes password by listing
    // it among the omitted keys so no throwaway binding is created.)
    const { pin, ...fields } = validatedData.data;
    const payload: Record<string, unknown> = {
      ...fields,
      scopeType: destination.type,
      scopeId: destination.id,
    };
    delete payload.password;
    if (fields.dateOfBirth)
      payload.dateOfBirth = fields.dateOfBirth.toISOString().split("T")[0];
    if (fields.joiningDate)
      payload.joiningDate = fields.joiningDate.toISOString().split("T")[0];
    if (pin && fields.posAccess) payload.pin = pin;

    await apiClient.post(`/api/v1/staff`, payload);

    revalidatePath("/staff");
    return parseStringify({
      responseType: "success",
      message: "Staff created successfully",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to create staff",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
};

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

    const {
      pin,
      password,
      posAccess,
      dashboardAccess,
      email,
      referredByCode,
      ...fields
    } = validatedData.data;
    const payload: Record<string, unknown> = { ...fields };
    if (fields.dateOfBirth)
      payload.dateOfBirth = fields.dateOfBirth.toISOString().split("T")[0];
    if (fields.joiningDate)
      payload.joiningDate = fields.joiningDate.toISOString().split("T")[0];

    await apiClient.put(`/api/v1/staff/${id}`, payload);

    revalidatePath("/staff");
    revalidatePath(`/staff/${id}`);
    return parseStringify({
      responseType: "success",
      message: "Staff updated successfully",
    });
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
    return {
      responseType: "success",
      message: "Staff deactivated successfully",
    };
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
    return {
      responseType: "success",
      message: "Staff reactivated successfully",
    };
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
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    // Passwordless grant: the backend creates the user and emails them a
    // set-password link — we only send the login email, never a password.
    await apiClient.post(`/api/v1/staff/${staffId}/dashboard-access`, {
      email,
    });

    revalidatePath("/staff");
    revalidatePath(`/staff/${staffId}`);
    return { responseType: "success", message: "Dashboard access granted" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message || "Failed to grant dashboard access",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const revokeDashboardAccess = async (
  staffId: string,
): Promise<FormResponse> => {
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

/**
 * Re-send the set-password invite email to a dashboard-staff member (their 24h
 * token expired or the email was lost). Re-mints a fresh token server-side.
 */
export const resendStaffInvite = async (
  staffId: string,
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/staff/${staffId}/resend-invite`, {});
    revalidatePath(`/staff/${staffId}`);
    return { responseType: "success", message: "Invite email re-sent" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message || "Failed to resend invite",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

/**
 * Change the address a dashboard-staff member signs in with. Updates the Settlo
 * login and the staff record together, and signs them out everywhere.
 *
 * Rejected by the backend when the login isn't ours to change — it also belongs
 * to the person's own Settlo account or to another business (SHARED_IDENTITY),
 * or when it's the account owner's own record.
 */
export const changeStaffEmail = async (
  staffId: string,
  email: string,
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.patch(`/api/v1/staff/${staffId}/email`, { email });
    revalidatePath("/staff");
    revalidatePath(`/staff/${staffId}`);
    return { responseType: "success", message: "Login email updated" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message || "Failed to change login email",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

/**
 * Email a dashboard-staff member a fresh set-password link and end their
 * dashboard sessions. Their current password keeps working until they use the
 * link, so a bounced email can't lock them out; POS PIN access is untouched.
 */
export const forceStaffPasswordReset = async (
  staffId: string,
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/staff/${staffId}/force-password-reset`, {});
    revalidatePath(`/staff/${staffId}`);
    return { responseType: "success", message: "Password reset link sent" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message || "Failed to reset password",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

// ---------------------------------------------------------------------------
// Multi-location assignments
// ---------------------------------------------------------------------------

export interface StaffAssignmentDto {
  id: string;
  scopeType: "LOCATION" | "STORE" | "WAREHOUSE";
  scopeId: string;
  roleId: string;
  roleName: string | null;
  active: boolean;
  primary: boolean;
}

export const getStaffAssignments = async (
  staffId: string,
): Promise<StaffAssignmentDto[]> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get<StaffAssignmentDto[] | null>(
      `/api/v1/staff/${staffId}/assignments`,
    );
    return parseStringify(data ?? []);
  } catch {
    return [];
  }
};

export const addStaffAssignment = async (
  staffId: string,
  input: {
    scopeType: "LOCATION" | "STORE" | "WAREHOUSE";
    scopeId: string;
    roleId: string;
  },
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/staff/${staffId}/assignments`, input);
    revalidatePath(`/staff/${staffId}`);
    return { responseType: "success", message: "Assignment added" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message || "Failed to add assignment",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const removeStaffAssignment = async (
  staffId: string,
  assignmentId: string,
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(`/api/v1/staff/${staffId}/assignments/${assignmentId}`);
    revalidatePath(`/staff/${staffId}`);
    return { responseType: "success", message: "Assignment removed" };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message || "Failed to remove assignment",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

// ---------------------------------------------------------------------------
// POS Access
// ---------------------------------------------------------------------------

export const grantPosAccess = async (
  staffId: string,
): Promise<FormResponse> => {
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

export const revokePosAccess = async (
  staffId: string,
): Promise<FormResponse> => {
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
    return {
      responseType: "error",
      message: validationError,
      error: new Error(validationError),
    };
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
    return {
      responseType: "error",
      message: validationError,
      error: new Error(validationError),
    };
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

/** Shape of one row from the Reports Service all-staff rollup. */
interface StaffRollupRow {
  staffId: string;
  staffName: string | null;
  image: string | null;
  totalOrdersCompleted: number | null;
  totalItemsSold: number | null;
  totalGrossAmount: number | null;
  totalNetAmount: number | null;
  totalGrossProfit: number | null;
}

export const staffReport = async (
  startDate?: Date,
  endDate?: Date,
): Promise<StaffSummaryReport | null> => {
  try {
    const location = await getCurrentLocation();
    if (!location?.id) return { staffReports: [] };

    const apiClient = new ApiClient("reports");
    const fmt = (d: Date) => d.toISOString().split("T")[0];
    const params: Record<string, unknown> = { locationId: location.id };
    if (startDate) params.startDate = fmt(startDate);
    if (endDate) params.endDate = fmt(endDate);

    // Reports Service returns a flat per-staff rollup list; the dashboard's
    // StaffSummaryReport wraps it under `staffReports`. Stock-intake counts
    // aren't part of this rollup, so they default to 0.
    const rows = await apiClient.get<StaffRollupRow[]>(
      `/api/v2/analytics/summary/staff/all`,
      { params },
    );

    const staffReports = (Array.isArray(rows) ? rows : []).map((r) => ({
      id: r.staffId,
      name: r.staffName ?? "",
      image: r.image ?? "",
      totalOrdersCompleted: Number(r.totalOrdersCompleted ?? 0),
      totalItemsSold: Number(r.totalItemsSold ?? 0),
      totalStockIntakePerformed: 0,
      totalGrossAmount: Number(r.totalGrossAmount ?? 0),
      totalNetAmount: Number(r.totalNetAmount ?? 0),
      totalGrossProfit: Number(r.totalGrossProfit ?? 0),
    }));
    return parseStringify({ staffReports });
  } catch (error: any) {
    throw new Error(error?.message || "Failed to fetch staff report");
  }
};

export const getStaffAudit = async (
  staffId: string,
  page: number,
  size: number,
): Promise<ApiResponse<StaffAuditEvent>> => {
  const apiClient = new ApiClient();
  const params = new URLSearchParams();
  params.append("page", String(page ? page - 1 : 0));
  params.append("size", String(size || 20));
  const data = await apiClient.get(
    `/api/v1/staff/${staffId}/audit?${params.toString()}`,
  );
  return parseStringify(data);
};
