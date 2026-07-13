"use server";

import { format, subDays } from "date-fns";

import ApiClient from "../settlo-api-client";
import { getCurrentLocation } from "./business/get-current-business";
import { getDaySessionCookie } from "./day-session-cookie-actions";
import { listDaySessions as listAccountsDaySessions } from "./location-day-sessions-actions";
import { ProductSummaryResponse } from "@/types/product/product-summary";

export const getLocationId = async (): Promise<string | undefined> => {
  const location = await getCurrentLocation();
  return location?.id;
};

/**
 * Resolve the location's *current business day* — the date the dashboard
 * should anchor to instead of the wall-clock calendar day.
 *
 * The Reports facts (`fact_orders`, `fact_expenses`, …) are stamped with the
 * day session's `businessDate` carried on the event payload, NOT the calendar
 * date of the event. A session opened last night — or any shop trading past
 * midnight — therefore files "today's" orders and expenses under an earlier
 * business date. Defaulting the dashboard to the calendar day then reads zero
 * while the numbers sit under the open session's business date (precisely the
 * expenses-total-zero symptom). Anchoring to the day session's businessDate
 * lines the window up exactly with the facts, and because the overview
 * aggregates purely by `business_date`, a single-date window automatically
 * compiles *every* session on that date (reopens included) into one total.
 *
 * All three steps are read-only, so this is safe to call during a Server
 * Component render (unlike `getCurrentDaySession`, which mutates the cookie):
 *  1. the live day-session cookie — kept in lock-step with Accounts' /current
 *     by the day-session widget in the protected layout — gives the OPEN
 *     session's businessDate with no network round-trip;
 *  2. otherwise the most recent non-superseded session's businessDate (day
 *     closed / between sessions), so the board shows the last business day
 *     traded rather than an empty calendar day;
 *  3. `null` when the location has no sessions at all (feature off / brand
 *     new) — the caller then falls back to the calendar day.
 */
export const resolveCurrentBusinessDate = async (
  locationId: string,
): Promise<string | null> => {
  // 1. Open session — hot path, no round-trip.
  const cookie = await getDaySessionCookie();
  if (cookie?.businessDate && cookie.locationId === locationId) {
    return cookie.businessDate;
  }

  // 2. No open session — fall back to the latest session's business day.
  try {
    const to = format(new Date(), "yyyy-MM-dd");
    const from = format(subDays(new Date(), 60), "yyyy-MM-dd");
    const sessions = await listAccountsDaySessions(locationId, from, to);
    const latest = sessions
      .filter((s) => s.status !== "DELETED" && s.status !== "SUPERSEDED")
      .map((s) => s.businessDate)
      .sort((a, b) => b.localeCompare(a))[0];
    return latest ?? null;
  } catch {
    // 3. Best-effort — Accounts unavailable or no sessions in range.
    return null;
  }
};

export const fetchOverview = async (
  startDate: string,
  endDate?: string,
  staffId?: string,
) => {
  try {
    const apiClient = new ApiClient("reports");
    const location = await getCurrentLocation();

    return await apiClient.get(`/api/v2/analytics/overview`, {
      params: {
        locationId: location?.id,
        startDate,
        endDate,
        ...(staffId && { staffId }),
      },
    });
  } catch (error) {
    console.error("Error fetching overview:", error);
    throw error;
  }
};

export const fetchOverviewByFilter = async (
  filter: string,
  customStart?: string | null,
  customEnd?: string | null,
  staffId?: string,
) => {
  try {
    const apiClient = new ApiClient("reports");
    const location = await getCurrentLocation();

    return await apiClient.get(`/api/v2/analytics/overview/by-filter`, {
      params: {
        locationId: location?.id,
        filter,
        ...(customStart && { customStart }),
        ...(customEnd && { customEnd }),
        ...(staffId && { staffId }),
      },
    });
  } catch (error) {
    console.error("Error fetching overview by filter:", error);
    throw error;
  }
};

export const fetchProductSummary = async (
  productId: string,
  startDate: string,
  endDate?: string,
): Promise<ProductSummaryResponse> => {
  try {
    const apiClient = new ApiClient("reports");
    const location = await getCurrentLocation();

    return await apiClient.get(`/api/v2/analytics/summary/product`, {
      params: {
        locationId: location?.id,
        productId,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error("Error fetching product summary:", error);
    throw error;
  }
};
