"use server";

import { cookies } from "next/headers";

/**
 * Cookie carrying the device's active day-session id so the API client
 * interceptor can stamp {@code X-Day-Session-Id} on every session-
 * dependent request. All server-side mutations to the cookie funnel
 * through this module — the day-session widget's existing
 * {@code DAY_SESSION_CHANGED_EVENT} re-triggers
 * {@link getDaySessionSummary} which writes the cookie fresh, so the
 * cache never stays stale through an open/close cycle.
 *
 * <p>Scoped per-location: the cookie records the location id alongside
 * the session id so the interceptor can confirm the session belongs to
 * the request's current location before attaching the header. Stops
 * a stale cookie from a previous location bleeding through after a
 * location switch.
 */
export interface DaySessionCookie {
  id: string;
  locationId: string;
  businessDate: string;
  status: "OPEN" | "CLOSED" | "SUPERSEDED";
}

const COOKIE_NAME = "currentDaySession";

export async function getDaySessionCookie(): Promise<DaySessionCookie | null> {
  try {
    const store = await cookies();
    const raw = store.get(COOKIE_NAME)?.value;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DaySessionCookie;
    if (!parsed?.id || !parsed.locationId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setDaySessionCookie(value: DaySessionCookie): Promise<void> {
  const store = await cookies();
  store.set({
    name: COOKIE_NAME,
    value: JSON.stringify(value),
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    // Keep readable from server actions only — no JS needs it on the client
    // since the day-session widget pulls the source-of-truth from the
    // /current endpoint and dispatches DAY_SESSION_CHANGED_EVENT for UI refresh.
    httpOnly: true,
    // Roughly a day — server interceptor refreshes this on every
    // getCurrentDaySession() call anyway, so the TTL is only a backstop
    // against a stale cookie outliving the auth session.
    maxAge: 60 * 60 * 24,
  });
}

export async function clearDaySessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
