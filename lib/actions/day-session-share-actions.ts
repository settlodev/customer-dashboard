"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { FormResponse } from "@/types/types";
import type { Staff } from "@/types/staff";
import type { LocationLetterhead } from "@/types/letterhead/type";
import type { DaySession } from "@/lib/actions/location-day-sessions-actions";
import type { DaySessionReport } from "@/lib/actions/day-session-list-actions";
import type { PaymentMethodReconciliation } from "@/types/payment-method-reconciliation/type";
import type { DaySessionPrepaymentsSummary } from "@/types/customer-prepayments/type";
import type {
  DaySessionRefundsResponse,
  DaySessionVoidsResponse,
} from "@/types/orders/type";
import type { DaySessionExpensesSummary } from "@/types/expense/type";

/**
 * Public share flow for the Close-of-Day report, mirroring the GRN /
 * invoice share convention (idempotent minted token on the entity; an
 * unauthenticated `isPlain` lookup keyed solely by the opaque token).
 *
 * Backend contract this expects (Accounts service, unless the team homes
 * the public aggregate elsewhere — only these three constants change):
 *
 *   POST   /api/v1/locations/{locationId}/day-sessions/{sessionId}/share
 *          body { expiresInDays: number | null }   (null = never expires)
 *          → { shareToken, shareTokenIssuedAt, expiresAt }
 *          Idempotent on the token; applies the requested expiry (stamp
 *          the absolute expiresAt server-side; re-minting updates it).
 *   DELETE /api/v1/locations/{locationId}/day-sessions/{sessionId}/share
 *          → 204/200                              (revoke; link then 404s)
 *   GET    /api/v1/public/day-sessions/reports/{token}
 *          → PublicCloseOfDay  (no auth; the backend aggregates the
 *            session + Z-report + cash-up + CoD extras + referenced staff
 *            + letterhead so the public page is a single round-trip).
 *          404 once the token is unknown, revoked, OR past expiresAt.
 */

const shareBase = (locationId: string, sessionId: string) =>
  `/api/v1/locations/${locationId}/day-sessions/${sessionId}/share`;

const PUBLIC_BASE = "/api/v1/public/day-sessions/reports";

/**
 * Consolidated public payload. Embeds every sub-object the report sheet
 * reads (identical shapes to the authenticated fetchers) plus the staff
 * records referenced by the report and the letterhead — so a public
 * visitor, who has no auth or active-destination, needs one request and
 * the sheet renders unchanged.
 */
export interface PublicCloseOfDay {
  session: DaySession;
  report: DaySessionReport | null;
  reconciliations: PaymentMethodReconciliation[];
  prepayments: DaySessionPrepaymentsSummary | null;
  refunds: DaySessionRefundsResponse | null;
  voids: DaySessionVoidsResponse | null;
  expenses: DaySessionExpensesSummary | null;
  /**
   * Staff referenced on the report (closed/opened/void/refund actors),
   * for name + avatar resolution. A structural subset of {@link Staff}
   * is enough — the sheet only reads id/fullName/jobTitle/color/roles.
   */
  staff: Staff[];
  letterhead: LocationLetterhead | null;
  currency: string | null;
  shareTokenIssuedAt: string | null;
  /** Absolute expiry; null when the link never expires. */
  expiresAt: string | null;
}

interface CodShareResponse {
  shareToken: string | null;
  shareTokenIssuedAt: string | null;
  expiresAt: string | null;
}

/**
 * Mint (or return the existing) share token for a session's Close-of-Day
 * report. Idempotent — repeated calls return the same token until
 * {@link revokeDaySessionReportShare}.
 */
export async function shareDaySessionReport(
  locationId: string,
  sessionId: string,
  expiresInDays?: number | null,
): Promise<
  | { shareToken: string; shareTokenIssuedAt: string | null; expiresAt: string | null }
  | { error: string }
> {
  try {
    const apiClient = new ApiClient();
    const res = (await apiClient.post(shareBase(locationId, sessionId), {
      expiresInDays: expiresInDays ?? null,
    })) as CodShareResponse;
    revalidatePath(`/day-sessions/${sessionId}`);
    if (!res?.shareToken) {
      return { error: "Share token missing from server response" };
    }
    return parseStringify({
      shareToken: res.shareToken,
      shareTokenIssuedAt: res.shareTokenIssuedAt ?? null,
      expiresAt: res.expiresAt ?? null,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create share link",
    };
  }
}

/** Revoke an active Close-of-Day share link. The link 404s afterwards. */
export async function revokeDaySessionReportShare(
  locationId: string,
  sessionId: string,
): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(shareBase(locationId, sessionId));
    revalidatePath(`/day-sessions/${sessionId}`);
    return { responseType: "success", message: "Share link revoked" };
  } catch (error) {
    return {
      responseType: "error",
      message: error instanceof Error ? error.message : "Failed to revoke share link",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Public lookup by share token. Unauthenticated (`isPlain`) — possession
 * of the token is the capability. Returns null on 404 (never shared or
 * revoked).
 */
export async function getPublicCloseOfDay(
  token: string,
): Promise<PublicCloseOfDay | null> {
  try {
    const apiClient = new ApiClient();
    apiClient.isPlain = true;
    const data = await apiClient.get<PublicCloseOfDay>(
      `${PUBLIC_BASE}/${encodeURIComponent(token)}`,
    );
    const dto = parseStringify(data) as PublicCloseOfDay | null;
    if (!dto) return null;
    // The backend aggregate omits (sends `null` for) the array members
    // when a session has no cash-up or references no staff, but the
    // interface — and every consumer (the share page + the report sheet)
    // — treats them as arrays. Normalise here so the declared type holds,
    // mirroring `listPaymentMethodReconciliations`'s `?? []` guarantee on
    // the authenticated report route.
    return {
      ...dto,
      reconciliations: dto.reconciliations ?? [],
      staff: dto.staff ?? [],
    };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      (error as { status?: number }).status === 404
    ) {
      return null;
    }
    throw error;
  }
}
