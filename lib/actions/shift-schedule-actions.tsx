"use server";

import { revalidatePath } from "next/cache";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";

export interface StaffSchedule {
  id: string;
  accountId: string;
  locationId: string;
  identifier: string;
  staffId: string;
  staffName: string;
  shiftTemplateId: string;
  shiftTemplateName: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const listSchedules = async (
  locationId: string,
  startDate?: string,
  endDate?: string,
  page?: number,
  size?: number,
): Promise<ApiResponse<StaffSchedule>> => {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams();
    if (locationId) params.append("locationId", locationId);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    params.append("page", String(page ?? 0));
    params.append("size", String(size ?? 20));
    const data = await apiClient.get(`/api/v1/shifts/schedules?${params.toString()}`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const getSchedule = async (id: string): Promise<StaffSchedule> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/shifts/schedules/${id}`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const getStaffSchedules = async (staffId: string): Promise<StaffSchedule[]> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/shifts/schedules/staff/${staffId}`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const createSchedule = async (data: {
  locationId: string;
  staffId: string;
  shiftTemplateId: string;
  scheduleDate: string;
  notes?: string;
}): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/shifts/schedules`, data);
    revalidatePath("/shifts");
    return { responseType: "success", message: "Schedule created successfully" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to create schedule",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const bulkCreateSchedules = async (schedules: Array<{
  locationId: string;
  staffId: string;
  shiftTemplateId: string;
  scheduleDate: string;
  notes?: string;
}>): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/shifts/schedules/bulk`, { schedules });
    revalidatePath("/shifts");
    return { responseType: "success", message: "Schedules created successfully" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to create schedules",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const updateSchedule = async (
  id: string,
  data: { shiftTemplateId?: string; scheduleDate?: string; notes?: string },
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.put(`/api/v1/shifts/schedules/${id}`, data);
    revalidatePath("/shifts");
    return { responseType: "success", message: "Schedule updated successfully" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to update schedule",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const cancelSchedule = async (id: string): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/shifts/schedules/${id}/cancel`, {});
    revalidatePath("/shifts");
    return { responseType: "success", message: "Schedule cancelled successfully" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to cancel schedule",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};
