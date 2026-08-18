"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { AccountingLocationSettings } from "@/types/accounting-location-settings/type";

import { accountingUrl } from "./accounting-client";

const FALLBACK = (
  locationId: string,
  businessId: string,
): AccountingLocationSettings => ({
  locationId,
  businessId,
  currency: "TZS",
  defaultCurrency: "TZS",
  pricesIncludeTax: false,
  requireApprovalForVoids: false,
  locationToLocationTransferEnabled: false,
});

/**
 * Fetch the merchant's location-scoped accounting settings (currency,
 * tax label, due-day defaults, etc.). Used by every form that needs
 * to render with real merchant configuration instead of TZS-hardcoded
 * defaults.
 *
 * Always returns a value — falls back to a safe default object if
 * the cache hasn't been hydrated yet so callers don't have to handle
 * a null branch.
 */
export async function getAccountingLocationSettings(): Promise<AccountingLocationSettings> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl("/api/v1/location-settings"),
    );
    return parseStringify(data) as AccountingLocationSettings;
  } catch (error) {
    console.error("getAccountingLocationSettings failed", error);
    return FALLBACK("", "");
  }
}
