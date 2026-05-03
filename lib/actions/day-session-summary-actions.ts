"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import {
  DaySession,
  getCurrentDaySession,
} from "./location-day-sessions-actions";

/**
 * Lightweight summary returned by the Reports Service current-session
 * endpoint. Shape mirrors {@code CurrentSessionSummaryDto} on the
 * backend — strips the heavier joins (COGS, gross-profit, expense
 * detail) the Z-report carries so the widget can poll at a higher
 * cadence without pressuring ClickHouse.
 *
 * <p>Includes the live extension window so the widget can render the
 * extend button only while {@code extensionAllowed=true}.
 */
export interface CurrentSessionSummary {
  sessionId: string;
  locationId: string;
  businessDate: string;
  status: "OPEN" | "CLOSED" | "DELETED";
  triggerType: "MANUAL" | "AUTO";

  openedAt: string;
  closedAt?: string | null;

  openedBy?: string | null;
  closedBy?: string | null;
  /** "System" when auto-opened; null when operator-opened (UI resolves UUID). */
  openedByLabel?: string | null;
  /** "System" when auto-closed; null otherwise. */
  closedByLabel?: string | null;

  extensionCount: number;
  extendedUntil?: string | null;
  extensionAllowed?: boolean | null;
  extensionWindowStart?: string | null;
  effectiveCloseAt?: string | null;

  forced?: number | null;
  isReopen?: number | null;
  openOrdersAtClose?: number | null;

  sales: { gross: number; discounts: number; net: number; tips: number };
  refunds: { count: number; amount: number };

  cashNet: number;
  paymentsByMethod: Array<{
    paymentMethodId: string;
    paymentMethodCode: string;
    paymentMethodName: string;
    count: number;
    amount: number;
  }>;
  orderCount: number;
}

/**
 * Combines the Accounts session row with the Reports widget summary.
 * The Accounts row is the source of truth for the operator-control
 * fields (extensionAllowed, effectiveCloseAt computed live from the
 * planner-task queue); the Reports row carries the sales aggregations.
 *
 * <p>Either half can be null:
 * <ul>
 *   <li>{@code session=null} when the location has no current OPEN
 *       session;</li>
 *   <li>{@code report=null} when Reports Service is cold (e.g. before
 *       the first order lands) or temporarily unavailable.</li>
 * </ul>
 */
export interface DaySessionSummary {
  session: DaySession | null;
  report: CurrentSessionSummary | null;
}

/**
 * Returns the current day-session view used by the dashboard widget.
 * The Accounts {@code /current} call returns the precise live values
 * for the action buttons (extensionAllowed, effectiveCloseAt); the
 * Reports {@code /current} call returns the sales summary. Both are
 * best-effort — the widget gracefully renders whatever it has.
 */
export async function getDaySessionSummary(
  locationId: string,
): Promise<DaySessionSummary> {
  // Accounts is the source of truth for the operator-control fields
  // (extensionAllowed/extensionWindowStart/effectiveCloseAt are
  // computed against the live planner-task queue and settings).
  const session = await getCurrentDaySession(locationId);

  let report: CurrentSessionSummary | null = null;
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({ locationId });
    const data = await apiClient.get(
      `/api/v2/analytics/day-sessions/current?${params.toString()}`,
    );
    if (data) {
      report = parseStringify(data) as CurrentSessionSummary;
    }
  } catch {
    // Reports temporarily unavailable — still surface the session so
    // the widget can render lifecycle without the totals.
    report = null;
  }

  if (!session && !report) return { session: null, report: null };

  return {
    session: session ? (parseStringify(session) as DaySession) : null,
    report,
  };
}
