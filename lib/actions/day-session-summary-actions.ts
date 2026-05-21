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
 *
 * <p>Accounts-first / Reports-enrichment, mirroring the day-sessions
 * list page:
 * <ol>
 *   <li>Try Accounts {@code /current} for the authoritative lifecycle
 *       row (extension window, identifier, notes).</li>
 *   <li>Try Reports {@code /current} for sales aggregates.</li>
 *   <li>If Accounts errored (network blip / 5xx) but Reports knows
 *       there's an OPEN session, <b>synthesise</b> a partial lifecycle
 *       from the Reports row so the widget keeps showing "open"
 *       instead of flashing closed.</li>
 *   <li>If both halves are empty <i>and</i> Accounts errored, throw —
 *       the widget's {@code load()} catch then preserves its previous
 *       summary rather than rendering an empty state from a blip.</li>
 * </ol>
 *
 * <p>Note: a clean 204 from Accounts (definitively "no session") still
 * resolves to {@code {session: null, report: null}} and is NOT treated
 * as a transient error.
 */
export async function getDaySessionSummary(
  locationId: string,
): Promise<DaySessionSummary> {
  // ── 1. Accounts (source of truth for lifecycle) ─────────────────
  let session: DaySession | null = null;
  let accountsAvailable = true;
  try {
    session = await getCurrentDaySession(locationId);
  } catch {
    accountsAvailable = false;
  }

  // ── 2. Reports (aggregates + fallback lifecycle on Accounts blips) ─
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
    // Reports temporarily unavailable — Accounts (if it answered) is
    // sufficient for the widget to render lifecycle without totals.
    report = null;
  }

  // ── 3. Synthesise lifecycle from Reports when Accounts blipped ─
  // Only when Accounts itself errored (NOT when it cleanly returned
  // null) and Reports has an OPEN session. Keeps the widget stable
  // through a brief outage instead of flashing "Business day closed".
  if (!accountsAvailable && !session && report?.status === "OPEN") {
    session = synthesizeFromReport(report, locationId);
  }

  // ── 4. Both empty + Accounts errored → propagate so the widget
  // keeps its last-known state instead of rendering a fresh empty-
  // state from a blip. A clean 204 still resolves normally.
  if (!accountsAvailable && !session && !report) {
    throw new Error(
      "Day-session refresh failed — Accounts and Reports both unavailable",
    );
  }

  return {
    session: session ? (parseStringify(session) as DaySession) : null,
    report,
  };
}

/**
 * Builds a partial {@link DaySession} from a Reports
 * {@link CurrentSessionSummary} so the widget can render the "open"
 * pill during a brief Accounts outage. Reports doesn't carry the
 * human-readable identifier or notes, so a {@code DSY-XXXXXX}
 * stand-in is generated from the session id prefix — the next
 * successful Accounts refresh swaps in the canonical value.
 *
 * <p>The synthesised row is a temporary view, not a write target —
 * extension and close actions still hit Accounts directly using
 * {@code session.id}, which IS canonical (Reports stores the same id).
 */
function synthesizeFromReport(
  report: CurrentSessionSummary,
  locationId: string,
): DaySession {
  const fallbackStatus: DaySession["status"] =
    report.status === "OPEN" || report.status === "CLOSED"
      ? report.status
      : "OPEN";
  return {
    id: report.sessionId,
    accountId: "",
    locationId: report.locationId ?? locationId,
    locationName: "",
    identifier: `DSY-${report.sessionId.slice(0, 6).toUpperCase()}`,
    businessDate: report.businessDate,
    status: fallbackStatus,
    triggerType: report.triggerType,
    openedAt: report.openedAt,
    closedAt: report.closedAt ?? undefined,
    openedBy: report.openedBy ?? undefined,
    closedBy: report.closedBy ?? undefined,
    openedByLabel: report.openedByLabel ?? null,
    closedByLabel: report.closedByLabel ?? null,
    openingNotes: undefined,
    closingNotes: undefined,
    createdAt: report.openedAt,
    updatedAt: report.openedAt,
    extendedUntil: report.extendedUntil ?? null,
    extensionCount: report.extensionCount,
    effectiveCloseAt: report.effectiveCloseAt ?? null,
    extensionAllowed: report.extensionAllowed ?? null,
    extensionWindowStart: report.extensionWindowStart ?? null,
  };
}
