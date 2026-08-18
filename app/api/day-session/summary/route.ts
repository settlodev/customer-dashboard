import { NextRequest, NextResponse } from "next/server";

import { getDaySessionSummary } from "@/lib/actions/day-session-summary-actions";

/**
 * Read-only widget endpoint that returns the current day-session
 * summary (Accounts lifecycle + Reports aggregates) for the given
 * location. Calling the existing server action directly from the
 * widget's client component triggered an automatic RSC re-render on
 * every poll — and the layout's reference-data fan-out then
 * cascaded into 429s on the gateway. A plain Route Handler is a
 * normal HTTP GET: no action protocol, no auto-refresh.
 *
 * <p><b>SECURITY — caller-supplied `locationId` is safe (verified).</b>
 * Although the caller chooses `locationId`, it is NOT trusted as an
 * authorization input: it is only a filter that BOTH downstream
 * services re-authorize against the caller's own JWT identity, so a
 * caller cannot read another tenant's location by passing a foreign
 * id.
 * <ul>
 *   <li>Accounts {@code GET /api/v1/locations/{locationId}/day-sessions/current}
 *       scopes by the JWT `account_id` claim
 *       (`requireLocation(accountId, locationId)` ->
 *       `findByIdAndAccountId`); a foreign id is rejected before any
 *       data query, and it does NOT trust the X-Account-Id header.</li>
 *   <li>Reports {@code GET /api/v2/analytics/day-sessions/current}
 *       runs `validateLocationAccess(locationId)`, comparing the
 *       caller's business to `dim_location.business_id`; a foreign id
 *       throws AccessDeniedException.</li>
 * </ul>
 * The access token is attached by ApiClient from the caller's own
 * HTTP-only cookie, so the identity these checks key on cannot be
 * spoofed by the caller. No extra ownership check is added here:
 * downstream already enforces it, and an extra /me/locations round-trip
 * on this 60s-polled hot path is exactly the fan-out load this route
 * was created to avoid. (Residual backend hardening, tracked
 * separately: Reports falls back to the client X-Business-Id header
 * only when the JWT lacks a business_id claim; Accounts stays
 * hard-scoped to the JWT account_id regardless.)
 */
export async function GET(request: NextRequest) {
  const locationId = request.nextUrl.searchParams.get("locationId");
  if (!locationId) {
    return NextResponse.json(
      { error: "locationId required" },
      { status: 400 },
    );
  }

  try {
    const summary = await getDaySessionSummary(locationId);
    return NextResponse.json(summary, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    // The widget catches non-2xx responses and keeps its last summary
    // rather than flashing closed — preserving that semantic here.
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load day session summary",
      },
      { status: 503 },
    );
  }
}
