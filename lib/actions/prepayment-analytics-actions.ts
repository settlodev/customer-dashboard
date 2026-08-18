"use server";

import { UUID } from "node:crypto";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type {
  CustomerPrepaymentBalance,
  PrepaymentAnalyticsOverview,
  PrepaymentTrendPoint,
} from "@/types/customer-prepayments/type";
import { rethrowIfBoundary } from "@/lib/list-fallback";

// Reports Service — ApiClient("reports") → REPORTS_SERVICE_URL.
const ANALYTICS = "/api/v2/analytics/prepayments";

export async function getPrepaymentAnalyticsOverview(
  locationId: string,
  startDate: string,
  endDate: string,
): Promise<PrepaymentAnalyticsOverview | null> {
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({ locationId, startDate, endDate });
    const data = await apiClient.get(`${ANALYTICS}/overview?${params.toString()}`);
    return parseStringify(data) as PrepaymentAnalyticsOverview;
  } catch (error) {
    rethrowIfBoundary(error);
    console.error("getPrepaymentAnalyticsOverview failed", error);
    return null;
  }
}

export async function getPrepaymentTrends(
  locationId: string,
  startDate: string,
  endDate: string,
): Promise<PrepaymentTrendPoint[]> {
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({ locationId, startDate, endDate });
    const data = await apiClient.get(`${ANALYTICS}/trends?${params.toString()}`);
    return parseStringify(data) as PrepaymentTrendPoint[];
  } catch (error) {
    console.error("getPrepaymentTrends failed", error);
    return [];
  }
}

/** Business-wide outstanding prepaid liability (the total creditors balance). */
export async function getOutstandingPrepaidLiability(
  businessId: string,
): Promise<PrepaymentAnalyticsOverview | null> {
  try {
    const apiClient = new ApiClient("reports");
    const data = await apiClient.get(
      `${ANALYTICS}/outstanding-liability?businessId=${businessId}`,
    );
    return parseStringify(data) as PrepaymentAnalyticsOverview;
  } catch (error) {
    rethrowIfBoundary(error);
    console.error("getOutstandingPrepaidLiability failed", error);
    return null;
  }
}

/** Customers owed the most prepaid credit, largest first — the creditors list. */
export async function getTopCustomerPrepaidBalances(
  businessId: string,
  limit = 20,
): Promise<CustomerPrepaymentBalance[]> {
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({ businessId, limit: String(limit) });
    const data = await apiClient.get(
      `${ANALYTICS}/top-customer-balances?${params.toString()}`,
    );
    return parseStringify(data) as CustomerPrepaymentBalance[];
  } catch (error) {
    rethrowIfBoundary(error);
    console.error("getTopCustomerPrepaidBalances failed", error);
    return [];
  }
}

export async function getOutstandingPrepaidBalanceByCustomer(
  customerId: UUID,
): Promise<CustomerPrepaymentBalance | null> {
  try {
    const apiClient = new ApiClient("reports");
    const data = await apiClient.get(
      `${ANALYTICS}/outstanding-balance?customerId=${customerId}`,
    );
    return parseStringify(data) as CustomerPrepaymentBalance;
  } catch (error) {
    console.error("getOutstandingPrepaidBalanceByCustomer failed", error);
    return null;
  }
}
