"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import {
  clearDaySessionCookie,
  setDaySessionCookie,
} from "@/lib/actions/day-session-cookie-actions";

export interface DaySession {
  id: string;
  accountId: string;
  locationId: string;
  locationName: string;
  identifier: string;
  businessDate: string;
  status: "OPEN" | "CLOSED" | "SUPERSEDED" | "DELETED";
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
    // Always send a non-empty body — the backend rejects `{}` with
    // INVALID_REQUEST_BODY, even though the controller declares the
    // request optional.
    const body: Record<string, unknown> = { notes: notes ?? null };
    const data = await apiClient.post(`/api/v1/locations/${locationId}/day-sessions/open`, body);
    const session = parseStringify(data) as DaySession | null;
    // Mirror the persisted session into the cookie so the next session-
    // dependent call (order create, expense, etc.) attaches the
    // X-Day-Session-Id header without a round-trip to /current first.
    if (session?.id) {
      await setDaySessionCookie({
        id: session.id,
        locationId: session.locationId ?? locationId,
        businessDate: session.businessDate,
        status: session.status,
      });
    }
    return { responseType: "success", message: "Day session opened", data: session ?? undefined };
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
    // Always send `force` so the body is never the empty object `{}`,
    // which the backend currently rejects with INVALID_REQUEST_BODY.
    const body: Record<string, unknown> = { force: !!force };
    if (notes) body.notes = notes;
    if (typeof closingFloat === "number") body.closingFloat = closingFloat;
    const data = await apiClient.post(`/api/v1/locations/${locationId}/day-sessions/close`, body);
    // Day closed — drop the cookie so subsequent session-dependent calls
    // surface BUSINESS_DAY_SESSION_HEADER_MISSING and the guard hook
    // prompts the operator to open the day.
    await clearDaySessionCookie();
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
    const session = parseStringify(data) as DaySession | null;
    // The extend may have chain-followed to a canonical session id —
    // refresh the cookie so future writes carry the canonical id.
    if (session?.id) {
      await setDaySessionCookie({
        id: session.id,
        locationId: session.locationId ?? locationId,
        businessDate: session.businessDate,
        status: session.status,
      });
    }
    return { responseType: "success", message: "Session extended", data: session ?? undefined };
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

/**
 * Returns the location's current active day session, or null when the
 * server explicitly says there is none (HTTP 204 / empty body). Throws
 * on transient errors (network, 5xx, timeouts) so callers can preserve
 * their last-known state instead of flashing "no session" during a
 * blip. Crucially we do NOT clear the day-session cookie on error —
 * a stale cookie that points at a still-valid session is preferable to
 * dropping the {@code X-Day-Session-Id} header on every subsequent
 * write while Accounts is briefly unavailable.
 */
export const getCurrentDaySession = async (locationId: string): Promise<DaySession | null> => {
  const apiClient = new ApiClient();
  // No try/catch — let errors propagate. Axios's default validateStatus
  // returns 204 successfully with an empty body (data is undefined),
  // which parseStringify maps to null. Only that path counts as "no
  // session"; everything else (4xx, 5xx, network) throws upstream.
  const data = await apiClient.get(`/api/v1/locations/${locationId}/day-sessions/current`);
  const session = parseStringify(data) as DaySession | null;
  // Keep the cookie in lock-step with the server's source of truth. The
  // widget calls this every 60s and on DAY_SESSION_CHANGED_EVENT, so the
  // cookie is always fresh enough for the interceptor to attach a
  // current X-Day-Session-Id header.
  if (session?.id) {
    await setDaySessionCookie({
      id: session.id,
      locationId: session.locationId ?? locationId,
      businessDate: session.businessDate,
      status: session.status,
    });
  } else {
    // No active session — clear any stale cookie so the next write
    // surfaces BUSINESS_DAY_SESSION_HEADER_MISSING cleanly.
    await clearDaySessionCookie();
  }
  return session;
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
