"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import {
  AdminBusinessFinancialsSummary,
  AdminBusinessInventorySummary,
} from "@/types/admin/business-operations";
import type { EntityStockSummary, EntityType } from "@/types/admin/inventory";

function inventoryClient() {
  return new ApiClient("inventory", "staff");
}

function accountingClient() {
  return new ApiClient("accounting", "staff");
}

export async function getBusinessInventorySummary(
  businessId: string,
): Promise<AdminBusinessInventorySummary> {
  const data = await inventoryClient().get<AdminBusinessInventorySummary>(
    `/api/v1/admin/businesses/${businessId}/inventory-summary`,
  );
  return parseStringify(data);
}

export async function getEntityStockSummary(
  entityType: EntityType,
  entityId: string,
): Promise<EntityStockSummary> {
  const data = await inventoryClient().get<EntityStockSummary>(
    `/api/v1/admin/inventory/stock-summary?locationType=${entityType}&locationId=${entityId}`,
  );
  return parseStringify(data);
}

/**
 * Financials for a business, or for one of its locations when `locationId` is
 * passed. Same endpoint, same arithmetic — omitting `locationId` keeps the
 * business-wide rollup exactly as before.
 */
export async function getBusinessFinancialsSummary(
  businessId: string,
  startDate?: string,
  endDate?: string,
  locationId?: string,
): Promise<AdminBusinessFinancialsSummary> {
  const qs = new URLSearchParams();
  if (startDate) qs.set("startDate", startDate);
  if (endDate) qs.set("endDate", endDate);
  if (locationId) qs.set("locationId", locationId);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const data = await accountingClient().get<AdminBusinessFinancialsSummary>(
    `/api/v1/admin/businesses/${businessId}/financials-summary${suffix}`,
  );
  return parseStringify(data);
}

/** Convenience wrapper — the location cut, read at the grain that trades. */
export async function getLocationFinancialsSummary(
  businessId: string,
  locationId: string,
  startDate?: string,
  endDate?: string,
): Promise<AdminBusinessFinancialsSummary> {
  return getBusinessFinancialsSummary(businessId, startDate, endDate, locationId);
}
