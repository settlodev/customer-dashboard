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

interface CookieEntity {
  id: string;
  businessId?: string;
}

async function readCookieEntity(name: string): Promise<CookieEntity | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(name)?.value;
    if (!raw || !raw.trim()) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.id !== "string") return null;
    return {
      id: parsed.id,
      businessId:
        typeof parsed?.businessId === "string" ? parsed.businessId : undefined,
    };
  } catch {
    return null;
  }
}

async function readCurrentBusinessId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get("currentBusiness")?.value;
    if (!raw || !raw.trim()) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.id === "string" ? parsed.id : null;
  } catch {
    return null;
  }
}

/** Returns the active destination or `null` if no workspace context is set. */
export async function getCurrentDestination(): Promise<ActiveDestination | null> {
  const [businessId, warehouse, store, location] = await Promise.all([
    readCurrentBusinessId(),
    readCookieEntity("currentWarehouse"),
    readCookieEntity("currentStore"),
    readCookieEntity("currentLocation"),
  ]);

  // A destination must belong to the *active* business. After a business
  // switch the previous business's destination cookie can linger; serving it
  // would stamp a cross-business X-Location-Id on every request and earn a
  // 403 "Not authorized to access location" from business-scoped services
  // (the Reports Service checks dim_location.business_id == caller business).
  // Drop any destination whose business doesn't match the active one.
  const belongs = (d: CookieEntity | null): CookieEntity | null => {
    if (!d) return null;
    if (businessId && d.businessId && d.businessId !== businessId) return null;
    return d;
  };

  const warehouseEntity = belongs(warehouse);
  const storeEntity = belongs(store);
  const locationEntity = belongs(location);

  if (warehouseEntity) return { type: "WAREHOUSE", id: warehouseEntity.id };
  if (storeEntity) return { type: "STORE", id: storeEntity.id };
  if (locationEntity) return { type: "LOCATION", id: locationEntity.id };
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
