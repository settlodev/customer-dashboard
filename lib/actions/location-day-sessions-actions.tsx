"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";

export interface DaySession {
  id: string;
  accountId: string;
  locationId: string;
  locationName: string;
  identifier: string;
  businessDate: string;
  status: "OPEN" | "CLOSED";
  triggerType: "MANUAL" | "SCHEDULED";
  openedAt: string;
  closedAt?: string;
  openedBy: string;
  closedBy?: string;
  openingNotes?: string;
  closingNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export const openDaySession = async (
  locationId: string,
  notes?: string,
): Promise<FormResponse<DaySession>> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.post(`/api/v1/locations/${locationId}/day-sessions/open`, { notes });
    return { responseType: "success", message: "Day session opened", data: parseStringify(data) };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to open day session",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const closeDaySession = async (
  locationId: string,
  notes?: string,
): Promise<FormResponse<DaySession>> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.post(`/api/v1/locations/${locationId}/day-sessions/close`, { notes });
    return { responseType: "success", message: "Day session closed", data: parseStringify(data) };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to close day session",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const getCurrentDaySession = async (locationId: string): Promise<DaySession | null> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/locations/${locationId}/day-sessions/current`);
    return parseStringify(data);
  } catch {
    // 204 No Content means no active session
    return null;
  }
};

export const listDaySessions = async (
  locationId: string,
  startDate: string,
  endDate: string,
): Promise<DaySession[]> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      `/api/v1/locations/${locationId}/day-sessions?startDate=${startDate}&endDate=${endDate}`,
    );
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const getDaySession = async (
  locationId: string,
  sessionId: string,
): Promise<DaySession> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/locations/${locationId}/day-sessions/${sessionId}`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};
