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
  triggerType: "MANUAL" | "AUTO";
  openedAt: string;
  closedAt?: string;
  openedBy?: string;
  closedBy?: string;
  /** "System" when auto-opened (openedBy=null && triggerType=AUTO), null otherwise. */
  openedByLabel?: string | null;
  /** "System" when auto-closed (closedBy=null after CLOSED), null otherwise. */
  closedByLabel?: string | null;
  openingNotes?: string;
  closingNotes?: string;
  createdAt: string;
  updatedAt: string;

  /** Operator-extended close moment; null when never extended. */
  extendedUntil?: string | null;
  /** Times the operator has extended this session. */
  extensionCount?: number;
  /** Live AUTO_CLOSE target (PENDING task's scheduled_for). Null when no AUTO_CLOSE queued. */
  effectiveCloseAt?: string | null;
  /** True when /extend will currently accept the request (now within grace window). */
  extensionAllowed?: boolean | null;
  /** Earliest moment /extend will accept (effectiveCloseAt - closeGraceMinutes). */
  extensionWindowStart?: string | null;
}

export const openDaySession = async (
  locationId: string,
  notes?: string,
): Promise<FormResponse<DaySession>> => {
  try {
    const apiClient = new ApiClient();
    const body: Record<string, unknown> = {};
    if (notes) body.notes = notes;
    const data = await apiClient.post(`/api/v1/locations/${locationId}/day-sessions/open`, body);
    return { responseType: "success", message: "Day session opened", data: parseStringify(data) };
  } catch (error) {
    const err = error as { code?: string; message?: string };
    // Already-open is functionally a success for callers that just need a
    // session — they can retry their original action immediately.
    if (err?.code === "DAY_SESSION_ALREADY_OPEN") {
      return { responseType: "success", message: "A business day is already open." };
    }
    return {
      responseType: "error",
      message: err?.message ?? "Failed to open day session",
      error: error instanceof Error ? error : new Error(String(error)),
      errorCode: err?.code,
    };
  }
};

export const closeDaySession = async (
  locationId: string,
  notes?: string,
  closingFloat?: number,
  force?: boolean,
): Promise<FormResponse<DaySession>> => {
  try {
    const apiClient = new ApiClient();
    const body: Record<string, unknown> = {};
    if (notes) body.notes = notes;
    if (typeof closingFloat === "number") body.closingFloat = closingFloat;
    if (force) body.force = true;
    const data = await apiClient.post(`/api/v1/locations/${locationId}/day-sessions/close`, body);
    return { responseType: "success", message: "Day session closed", data: parseStringify(data) };
  } catch (error) {
    const err = error as { code?: string; message?: string };
    return {
      responseType: "error",
      message: err?.message ?? "Failed to close day session",
      error: error instanceof Error ? error : new Error(String(error)),
      errorCode: err?.code,
    };
  }
};

/**
 * Push the auto-close target back. Backend rejects with EXTENSION_TOO_EARLY
 * when called outside the grace window — UI should hide the button while
 * extensionAllowed=false to avoid the round-trip.
 */
export const extendDaySession = async (
  locationId: string,
  sessionId: string,
  minutes: number,
  notes?: string,
): Promise<FormResponse<DaySession>> => {
  try {
    const apiClient = new ApiClient();
    const body: Record<string, unknown> = { minutes };
    if (notes) body.notes = notes;
    const data = await apiClient.post(
      `/api/v1/locations/${locationId}/day-sessions/${sessionId}/extend`,
      body,
    );
    return { responseType: "success", message: "Session extended", data: parseStringify(data) };
  } catch (error) {
    const err = error as { code?: string; message?: string };
    return {
      responseType: "error",
      message: err?.message ?? "Failed to extend session",
      error: error instanceof Error ? error : new Error(String(error)),
      errorCode: err?.code,
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
