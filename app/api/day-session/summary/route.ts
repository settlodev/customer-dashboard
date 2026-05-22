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
