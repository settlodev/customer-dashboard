"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import {
  BusinessCustomerSegmentRow,
  BusinessDailyTrendRow,
  BusinessHealthSnapshot,
  BusinessLifecycleSnapshot,
  BusinessLocationBreakdownRow,
  BusinessOverviewSnapshot,
  DateRangeFilter,
} from "@/types/admin/business-intel";

function reportsClient() {
  return new ApiClient("reports", "staff");
}

const ANALYTICS_PREFIX = "/api/v2/analytics/business";
/**
 * Location-grained twin of ANALYTICS_PREFIX. A location — not a business — is
 * what holds a subscription and rings up sales, so it gets the same scorecard;
 * the business figure is the sum of its locations. Rows come back in the same
 * shape, so `BusinessOverviewSnapshot` serves both grains.
 *
 * Note this is NOT `/api/v2/analytics/overview?locationId=` — that one is the
 * merchant-facing endpoint, gated on the merchant `reports:read_all` permission
 * an internal staff token doesn't carry, and it omits staff/customer counts.
 */
const LOCATION_ANALYTICS_PREFIX = "/api/v2/analytics/location";

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getDefaultIntelRange(days = 30): Promise<{
  startDate: string;
  endDate: string;
}> {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return { startDate: isoDate(start), endDate: isoDate(end) };
}

export async function getBusinessOverview(
  businessId: string,
  startDate: string,
  endDate?: string,
): Promise<BusinessOverviewSnapshot | null> {
  const qs = new URLSearchParams();
  qs.set("startDate", startDate);
  if (endDate) qs.set("endDate", endDate);
  const data = await reportsClient().get<BusinessOverviewSnapshot | null>(
    `${ANALYTICS_PREFIX}/${businessId}/overview?${qs.toString()}`,
  );
  return data ? parseStringify(data) : null;
}

export async function getBusinessOverviewByFilter(
  businessId: string,
  filter: DateRangeFilter,
): Promise<BusinessOverviewSnapshot | null> {
  const qs = new URLSearchParams();
  qs.set("filter", filter);
  const data = await reportsClient().get<BusinessOverviewSnapshot | null>(
    `${ANALYTICS_PREFIX}/${businessId}/overview/by-filter?${qs.toString()}`,
  );
  return data ? parseStringify(data) : null;
}

export async function getLocationOverview(
  locationId: string,
  startDate: string,
  endDate?: string,
): Promise<BusinessOverviewSnapshot | null> {
  const qs = new URLSearchParams();
  qs.set("startDate", startDate);
  if (endDate) qs.set("endDate", endDate);
  const data = await reportsClient().get<BusinessOverviewSnapshot | null>(
    `${LOCATION_ANALYTICS_PREFIX}/${locationId}/overview?${qs.toString()}`,
  );
  return data ? parseStringify(data) : null;
}

export async function getLocationOverviewByFilter(
  locationId: string,
  filter: DateRangeFilter,
): Promise<BusinessOverviewSnapshot | null> {
  const qs = new URLSearchParams();
  qs.set("filter", filter);
  const data = await reportsClient().get<BusinessOverviewSnapshot | null>(
    `${LOCATION_ANALYTICS_PREFIX}/${locationId}/overview/by-filter?${qs.toString()}`,
  );
  return data ? parseStringify(data) : null;
}

export async function getLocationTrends(
  locationId: string,
  startDate: string,
  endDate: string,
): Promise<BusinessDailyTrendRow[]> {
  const qs = new URLSearchParams();
  qs.set("startDate", startDate);
  qs.set("endDate", endDate);
  const data = await reportsClient().get<BusinessDailyTrendRow[]>(
    `${LOCATION_ANALYTICS_PREFIX}/${locationId}/trends?${qs.toString()}`,
  );
  return parseStringify(data);
}

export async function getBusinessLocationBreakdown(
  businessId: string,
  startDate: string,
  endDate?: string,
): Promise<BusinessLocationBreakdownRow[]> {
  const qs = new URLSearchParams();
  qs.set("startDate", startDate);
  if (endDate) qs.set("endDate", endDate);
  const data = await reportsClient().get<BusinessLocationBreakdownRow[]>(
    `${ANALYTICS_PREFIX}/${businessId}/locations?${qs.toString()}`,
  );
  return parseStringify(data);
}

export async function getBusinessTrends(
  businessId: string,
  startDate: string,
  endDate: string,
): Promise<BusinessDailyTrendRow[]> {
  const qs = new URLSearchParams();
  qs.set("startDate", startDate);
  qs.set("endDate", endDate);
  const data = await reportsClient().get<BusinessDailyTrendRow[]>(
    `${ANALYTICS_PREFIX}/${businessId}/trends?${qs.toString()}`,
  );
  return parseStringify(data);
}

export async function getBusinessHealth(
  businessId: string,
): Promise<BusinessHealthSnapshot | null> {
  const data = await reportsClient().get<BusinessHealthSnapshot | null>(
    `${ANALYTICS_PREFIX}/${businessId}/health`,
  );
  return data ? parseStringify(data) : null;
}

export async function getBusinessLifecycle(
  businessId: string,
): Promise<BusinessLifecycleSnapshot | null> {
  try {
    const data = await reportsClient().get<BusinessLifecycleSnapshot | null>(
      `${ANALYTICS_PREFIX}/${businessId}/lifecycle`,
    );
    return data ? parseStringify(data) : null;
  } catch (error: any) {
    // 404 = no rollup row yet (newly-created business). Soft-fail.
    if (error?.status === 404) return null;
    throw error;
  }
}

/**
 * Batch lifecycle lookup — returns a map of businessId → snapshot for
 * every business id that has a row in the lifecycle rollup. Ids with no
 * row are omitted; the caller falls back to "no data yet" client-side.
 *
 * Capped at 50 ids per call by the backend.
 */
export async function getBusinessLifecycleBatch(
  businessIds: string[],
): Promise<Record<string, BusinessLifecycleSnapshot>> {
  if (businessIds.length === 0) return {};
  const data = await reportsClient().post<
    BusinessLifecycleSnapshot[],
    { businessIds: string[] }
  >(`${ANALYTICS_PREFIX}/lifecycle-batch`, { businessIds });
  const list = parseStringify(data) as BusinessLifecycleSnapshot[];
  const byId: Record<string, BusinessLifecycleSnapshot> = {};
  for (const row of list) {
    if (row?.business_id) byId[row.business_id] = row;
  }
  return byId;
}

export async function getBusinessCustomerSegments(
  businessId: string,
): Promise<BusinessCustomerSegmentRow[]> {
  const data = await reportsClient().get<BusinessCustomerSegmentRow[]>(
    `${ANALYTICS_PREFIX}/${businessId}/customer-segments`,
  );
  return parseStringify(data);
}
