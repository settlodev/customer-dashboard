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
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { getCurrentLocation } from "./business/get-current-business";

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
  const data = await apiClient.get(`/api/v1/staff/enriched?${params.toString()}`);
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
    const location = await getCurrentLocation();

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
    if (pin && fields.posAccess) payload.pin = pin;
    if (fields.dashboardAccess && password) payload.password = password;

    await apiClient.post(`/api/v1/staff`, payload);

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

    const { pin, password, posAccess, dashboardAccess, email, referredByCode, ...fields } = validatedData.data;
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
    await apiClient.post(`/api/v1/staff/${staffId}/dashboard-access`, {
      email,
      password,
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

