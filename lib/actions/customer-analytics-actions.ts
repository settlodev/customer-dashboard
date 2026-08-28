"use server";

import { UUID } from "node:crypto";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { rethrowIfBoundary } from "@/lib/list-fallback";
import type { CustomerPurchaseSummary } from "@/types/customer/type";

// Reports Service — ApiClient("reports") → REPORTS_SERVICE_URL.
const ANALYTICS = "/api/v2/analytics/customers";

/**
 * Order count + lifetime value for every customer who has bought at this
 * location, biggest spender first. One grouped scan over `fact_orders` — the
 * customers list joins the result onto the rows it is rendering rather than
 * fetching per row.
 *
 * Customers with no orders are absent from the response; callers treat a
 * missing entry as zero.
 */
export async function getCustomerPurchaseSummaries(
  locationId: string,
  limit = 500,
): Promise<CustomerPurchaseSummary[]> {
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({ locationId, limit: String(limit) });
    const data = await apiClient.get(
      `${ANALYTICS}/purchase-summary?${params.toString()}`,
    );
    return parseStringify(data) as CustomerPurchaseSummary[];
  } catch (error) {
    rethrowIfBoundary(error);
    console.error("getCustomerPurchaseSummaries failed", error);
    return [];
  }
}

/** One customer's roll-up, across every location they have bought at. */
export async function getCustomerPurchaseSummary(
  customerId: UUID,
): Promise<CustomerPurchaseSummary | null> {
  try {
    const apiClient = new ApiClient("reports");
    const data = await apiClient.get(
      `${ANALYTICS}/${customerId}/purchase-summary`,
    );
    return parseStringify(data) as CustomerPurchaseSummary;
  } catch (error) {
    rethrowIfBoundary(error);
    console.error("getCustomerPurchaseSummary failed", error);
    return null;
  }
}
