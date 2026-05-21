"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import {
  AdminBusinessFinancialsSummary,
  AdminBusinessInventorySummary,
} from "@/types/admin/business-operations";

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

export async function getBusinessFinancialsSummary(
  businessId: string,
  startDate?: string,
  endDate?: string,
): Promise<AdminBusinessFinancialsSummary> {
  const qs = new URLSearchParams();
  if (startDate) qs.set("startDate", startDate);
  if (endDate) qs.set("endDate", endDate);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const data = await accountingClient().get<AdminBusinessFinancialsSummary>(
    `/api/v1/admin/businesses/${businessId}/financials-summary${suffix}`,
  );
  return parseStringify(data);
}
