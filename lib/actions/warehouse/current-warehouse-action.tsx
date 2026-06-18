"use server";

import { cookies } from "next/headers";
import type { Warehouses } from "@/types/warehouse/warehouse/type";
import { getCurrentBusinessId } from "@/lib/actions/business/get-current-business";

/** Reads the active warehouse from the `currentWarehouse` cookie, if any. */
export const getCurrentWarehouse = async (): Promise<Warehouses | undefined> => {
  const cookieStore = await cookies();
  const raw = cookieStore.get("currentWarehouse")?.value;
  if (!raw || !raw.trim()) return undefined;

  let warehouse: Warehouses;
  try {
    warehouse = JSON.parse(raw) as Warehouses;
  } catch {
    return undefined;
  }

  // The active warehouse must belong to the active business. A warehouse
  // lingering from a previous business after a switch would stamp a
  // cross-business X-Location-Id and 403 against business-scoped services.
  // Treat a mismatch as "no active warehouse". (Mirrors getCurrentLocation.)
  const businessId = await getCurrentBusinessId();
  if (
    businessId &&
    warehouse.businessId &&
    warehouse.businessId !== businessId
  ) {
    return undefined;
  }

  return warehouse;
};
