"use server";

import { cookies } from "next/headers";
import type { Warehouses } from "@/types/warehouse/warehouse/type";

/** Reads the active warehouse from the `currentWarehouse` cookie, if any. */
export const getCurrentWarehouse = async (): Promise<Warehouses | undefined> => {
  const cookieStore = await cookies();
  const raw = cookieStore.get("currentWarehouse")?.value;
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as Warehouses;
  } catch {
    return undefined;
  }
};
