"use server";

import { cookies } from "next/headers";
import type { DestinationType } from "@/types/catalogue/enums";

/**
 * Destination context resolved from the user's current workspace cookies.
 *
 *  - `WAREHOUSE` when `currentWarehouse` is set (warehouse-mode pages)
 *  - `STORE`     when `currentStore` is set under a location
 *  - `LOCATION`  fallback when only `currentLocation` is set
 *
 * The returned `id` is the UUID to send as `X-Location-Id` on inventory
 * requests and as `locationType` + `locationId` in request bodies. It updates
 * automatically whenever the user switches context via the location switcher.
 */
export interface ActiveDestination {
  type: DestinationType;
  id: string;
}

async function readCookieId(name: string): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(name)?.value;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.id === "string" ? parsed.id : null;
  } catch {
    return null;
  }
}

/** Returns the active destination or `null` if no workspace context is set. */
export async function getCurrentDestination(): Promise<ActiveDestination | null> {
  const [warehouseId, storeId, locationId] = await Promise.all([
    readCookieId("currentWarehouse"),
    readCookieId("currentStore"),
    readCookieId("currentLocation"),
  ]);

  if (warehouseId) return { type: "WAREHOUSE", id: warehouseId };
  if (storeId) return { type: "STORE", id: storeId };
  if (locationId) return { type: "LOCATION", id: locationId };
  return null;
}

/** Variant that throws when no destination is active. */
export async function requireCurrentDestination(): Promise<ActiveDestination> {
  const dest = await getCurrentDestination();
  if (!dest) {
    throw new Error("No active location, store, or warehouse selected");
  }
  return dest;
}
