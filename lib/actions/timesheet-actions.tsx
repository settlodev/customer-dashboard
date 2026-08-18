"use server";

import { revalidatePath } from "next/cache";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";

export interface TimesheetEntry {
  id: string;
  accountId: string;
  locationId: string;
  identifier: string;
  staffId: string;
  staffName: string;
  scheduleId?: string;
  clockInTime: string;
  clockOutTime?: string;
  breakMinutes?: number;
  totalWorkedMinutes?: number;
  overtimeMinutes?: number;
  status: "CLOCKED_IN" | "CLOCKED_OUT" | "APPROVED";
  notes?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export const listTimesheets = async (
  locationId: string,
  startDate?: string,
  endDate?: string,
  page?: number,
  size?: number,
): Promise<ApiResponse<TimesheetEntry>> => {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams();
    if (locationId) params.append("locationId", locationId);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    params.append("page", String(page ?? 0));
    params.append("size", String(size ?? 20));
    const data = await apiClient.get(`/api/v1/shifts/timesheet?${params.toString()}`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const getTimesheetEntry = async (entryId: string): Promise<TimesheetEntry> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/shifts/timesheet/${entryId}`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const getStaffTimesheet = async (
  staffId: string,
  startDate?: string,
  endDate?: string,
): Promise<TimesheetEntry[]> => {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await apiClient.get(`/api/v1/shifts/timesheet/staff/${staffId}${query}`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const clockIn = async (data: {
  locationId: string;
  staffId: string;
  scheduleId?: string;
  notes?: string;
}): Promise<FormResponse<TimesheetEntry>> => {
  try {
    const apiClient = new ApiClient();
    const response = await apiClient.post(`/api/v1/shifts/timesheet/clock-in`, data);
    revalidatePath("/timesheets");
    return { responseType: "success", message: "Clocked in successfully", data: parseStringify(response) };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to clock in",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const clockOut = async (
  entryId: string,
  data?: { breakMinutes?: number; notes?: string },
): Promise<FormResponse<TimesheetEntry>> => {
  try {
    const apiClient = new ApiClient();
    const response = await apiClient.post(`/api/v1/shifts/timesheet/${entryId}/clock-out`, data ?? {});
    revalidatePath("/timesheets");
    return { responseType: "success", message: "Clocked out successfully", data: parseStringify(response) };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to clock out",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const clockOutByStaff = async (
  staffId: string,
  data?: { breakMinutes?: number; notes?: string },
): Promise<FormResponse<TimesheetEntry>> => {
  try {
    const apiClient = new ApiClient();
    const response = await apiClient.post(`/api/v1/shifts/timesheet/staff/${staffId}/clock-out`, data ?? {});
    revalidatePath("/timesheets");
    return { responseType: "success", message: "Clocked out successfully", data: parseStringify(response) };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to clock out",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const approveTimesheet = async (entryId: string): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/shifts/timesheet/${entryId}/approve`, {});
    revalidatePath("/timesheets");
    return { responseType: "success", message: "Timesheet approved" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to approve timesheet",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const updateTimesheetEntry = async (
  entryId: string,
  data: { clockInTime?: string; clockOutTime?: string; breakMinutes?: number; notes?: string },
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.put(`/api/v1/shifts/timesheet/${entryId}`, data);
    revalidatePath("/timesheets");
    return { responseType: "success", message: "Timesheet entry updated" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to update timesheet entry",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};
