"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { UnitOfMeasure, UnitConversion, ConvertResult } from "@/types/unit/type";
import { inventoryUrl } from "./inventory-client";

/**
 * Units of measure are managed by super admins.
 * This dashboard only reads them for selection in stock/product forms.
 */

export async function getUnits(): Promise<UnitOfMeasure[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl("/api/v1/units-of-measure"));
    return parseStringify(data) as UnitOfMeasure[];
  } catch {
    return [];
  }
}

export async function getUnit(id: string): Promise<UnitOfMeasure | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl(`/api/v1/units-of-measure/${id}`));
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function getConversions(unitId: string): Promise<UnitConversion[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/units-of-measure/${unitId}/conversions`),
    );
    return parseStringify(data) as UnitConversion[];
  } catch {
    return [];
  }
}

export async function convertUnits(
  fromUnitId: string,
  toUnitId: string,
  quantity: number,
): Promise<ConvertResult | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.post(
      inventoryUrl("/api/v1/units-of-measure/convert"),
      { fromUnitId, toUnitId, quantity },
    );
    return parseStringify(data) as ConvertResult;
  } catch {
    return null;
  }
}
