"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { Location } from "@/types/location/type";
import type { Store } from "@/types/store/type";
import type { Warehouses } from "@/types/warehouse/warehouse/type";
import { getAuthToken, updateAuthToken } from "@/lib/auth-utils";
import { extractSubscriptionStatus } from "@/lib/jwt-utils";
import { clearDaySessionCookie } from "./day-session-cookie-actions";

// ── Unified destination switcher ────────────────────────────────────
// A destination is exactly one of: Location, Store, or Warehouse. When
// switching, we write the chosen cookie and clear the other two so only
// one context is ever active — the `getCurrentDestination()` resolver
// in `lib/actions/context.ts` depends on this invariant.

const COOKIE_LOCATION = "currentLocation";
const COOKIE_STORE = "currentStore";
const COOKIE_WAREHOUSE = "currentWarehouse";
const LEGACY_COOKIES = ["activeLocation", "activeWarehouse"] as const;

function cookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ("strict" as const) : ("lax" as const),
  };
}

async function clearAllDestinationCookies(keep?: string) {
  const cookieStore = await cookies();
  for (const name of [COOKIE_LOCATION, COOKIE_STORE, COOKIE_WAREHOUSE]) {
    if (name !== keep) cookieStore.delete(name);
  }
  // Sweep any stale legacy cookies regardless of which destination wins.
  for (const name of LEGACY_COOKIES) cookieStore.delete(name);
}

/**
 * Refreshes the access token so its claims (subscription status, assignment)
 * match the destination the user just switched to. Non-fatal if it fails —
 * the next API call will refresh reactively.
 */
async function refreshTokenForDestination(): Promise<void> {
  try {
    const authToken = await getAuthToken();
    if (!authToken?.refreshToken) return;

    const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "";
    const clientId = process.env.NEXT_PUBLIC_WHITELABEL_CLIENT_ID;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (clientId) headers["X-Client-Id"] = clientId;

    const res = await fetch(`${AUTH_SERVICE_URL}/auth/token-refresh`, {
      method: "POST",
      headers,
      body: JSON.stringify({ refreshToken: authToken.refreshToken }),
    });
    if (!res.ok) return;

    const data = await res.json();
    await updateAuthToken({
      ...authToken,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || authToken.refreshToken,
      subscriptionStatus: extractSubscriptionStatus(data.accessToken),
    });
  } catch {
    // Non-critical
  }
}

/**
 * Re-mints the access token after a payment/activation so its `subscription_status`
 * claim catches up. The middleware gate reads that cached claim, NOT live billing, so
 * without this a freshly-activated/paid subscription can leave the user pinned to
 * /billing even though billing already shows ACTIVE (issue 4). Best-effort: a failure
 * is non-fatal (the next destination switch / proactive refresh will catch up), and
 * billing now emits SUBSCRIPTION_UPDATED on activation so the re-minted token reflects
 * the new status.
 */
export async function refreshSubscriptionToken(): Promise<void> {
  await refreshTokenForDestination();
  revalidatePath("/", "layout");
}

// ── Switch actions ──────────────────────────────────────────────────

export async function switchToLocation(data: Location): Promise<void> {
  if (!data?.id) throw new Error("Location data is required");

  const cookieStore = await cookies();
  await clearAllDestinationCookies(COOKIE_LOCATION);
  cookieStore.set({
    name: COOKIE_LOCATION,
    value: JSON.stringify(data),
    ...cookieOptions(),
  });

  await refreshTokenForDestination();
  revalidatePath("/", "layout");
}

export async function switchToStore(data: Store): Promise<void> {
  if (!data?.id) throw new Error("Store data is required");

  const cookieStore = await cookies();
  await clearAllDestinationCookies(COOKIE_STORE);
  cookieStore.set({
    name: COOKIE_STORE,
    value: JSON.stringify(data),
    ...cookieOptions(),
  });

  await refreshTokenForDestination();
  revalidatePath("/", "layout");
}

export async function switchToWarehouse(data: Warehouses): Promise<void> {
  if (!data?.id) throw new Error("Warehouse data is required");

  const cookieStore = await cookies();
  await clearAllDestinationCookies(COOKIE_WAREHOUSE);
  cookieStore.set({
    name: COOKIE_WAREHOUSE,
    value: JSON.stringify(data),
    ...cookieOptions(),
  });

  await refreshTokenForDestination();
  revalidatePath("/", "layout");
}

/** Clears all destination cookies — used on logout or when a business is unset. */
export async function clearDestination(): Promise<void> {
  await clearAllDestinationCookies();
  // The day session is location-bound. When the whole destination context is
  // dropped (logout, account switch, business switch) the cached session no
  // longer applies. Per-destination switches deliberately keep it — a
  // store/warehouse rolls up to the same parent location, enforced by the
  // X-Day-Session-Id per-location guard in the ApiClient.
  await clearDaySessionCookie();
  revalidatePath("/", "layout");
}
