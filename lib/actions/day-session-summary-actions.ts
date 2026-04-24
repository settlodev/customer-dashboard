"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import {
  DaySession,
  getCurrentDaySession,
} from "./location-day-sessions-actions";

/**
 * Shape of the Reports Service Z-report (returned as X-report while the
 * session is still OPEN with {@code preliminary: true}). Mirrors
 * {@code ZReportDto} on the backend.
 */
export interface ZReportSection {
  count: number;
  amount: number;
}

export interface ZReportPayment {
  paymentMethodId: string;
  paymentMethodCode: string;
  paymentMethodName: string;
  count: number;
  amount: number;
  tips: number;
}

export interface ZReport {
  sessionId: string;
  locationId: string;
  businessDate: string;
  status: "OPEN" | "CLOSED" | "DELETED";
  openedAt: string;
  closedAt?: string | null;
  preliminary: boolean;
  openOrdersAtClose?: number | null;
  sales: { gross: number; discounts: number; net: number; tips: number };
  refunds: ZReportSection;
  expenses: ZReportSection;
  cogs: number;
  grossProfit: number;
  paymentsByMethod: ZReportPayment[];
  cashNet: number;
  orderCount: number;
}

export interface DaySessionSummary {
  session: DaySession | null;
  report: ZReport | null;
}

/**
 * Returns the current OPEN day session for a location plus its running
 * X-report metrics. Either half can be null — the Accounts current-session
 * call can return 204 (no open day) and Reports Service may be cold before
 * the first order lands in the session.
 */
export async function getDaySessionSummary(
  locationId: string,
): Promise<DaySessionSummary> {
  const session = await getCurrentDaySession(locationId);
  if (!session || session.status !== "OPEN") {
    return { session: null, report: null };
  }

  let report: ZReport | null = null;
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({ locationId });
    const data = await apiClient.get(
      `/api/v2/analytics/day-sessions/${session.id}/x-report?${params.toString()}`,
    );
    report = parseStringify(data) as ZReport;
  } catch {
    // Metrics temporarily unavailable — still surface the session so the
    // widget can show "day is open" without the totals.
    report = null;
  }

  return { session: parseStringify(session) as DaySession, report };
}
