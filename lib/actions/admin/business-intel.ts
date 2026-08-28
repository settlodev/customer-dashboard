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
  LocationHealthRow,
  LocationLifecycleSnapshot,
  LocationStaffRow,
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

/**
 * Latest health score for a location (V081). Same five sub-scores and weights
 * the business model produces, so the two are directly comparable — which is the
 * point: a location scoring 40 under a business scoring 75 is the branch the
 * business-level number was hiding.
 *
 * Returns null when the nightly model hasn't covered this location yet; the
 * endpoint answers with an empty object rather than a 404, matching the business
 * health endpoint.
 */
export async function getLocationHealth(
  locationId: string,
): Promise<BusinessHealthSnapshot | null> {
  const data = await reportsClient().get<Record<string, unknown> | null>(
    `${LOCATION_ANALYTICS_PREFIX}/${locationId}/health`,
  );
  if (!data || Object.keys(data).length === 0) return null;
  return parseStringify(data) as BusinessHealthSnapshot;
}

/**
 * Every location of one business, scored and ranked worst-first — the view the
 * business grain cannot give you.
 */
export async function getLocationHealthByBusiness(
  businessId: string,
): Promise<LocationHealthRow[]> {
  const data = await reportsClient().get<LocationHealthRow[]>(
    `${LOCATION_ANALYTICS_PREFIX}/health/by-business/${businessId}`,
  );
  return parseStringify(data);
}

/**
 * Who sold what at this location over the window. The leaderboard endpoint is
 * business-scoped with an optional locationId — staff are attributed per order,
 * and an order belongs to a location, so the location cut is the meaningful one.
 */
export async function getLocationStaffLeaderboard(
  businessId: string,
  locationId: string,
  startDate: string,
  endDate: string,
): Promise<LocationStaffRow[]> {
  const qs = new URLSearchParams();
  qs.set("locationId", locationId);
  qs.set("startDate", startDate);
  qs.set("endDate", endDate);
  const data = await reportsClient().get<LocationStaffRow[]>(
    `${ANALYTICS_PREFIX}/${businessId}/staff-leaderboard?${qs.toString()}`,
  );
  return parseStringify(data);
}

/**
 * RFM segment mix for this location's own customers (V083).
 *
 * Same row shape as the business-level segments, so one type serves both — but
 * NOT a slice of them. Segments are recomputed from this location's orders, so a
 * customer who visits two branches is scored at each and counts across a
 * business's locations do not sum to its business-level count. Revenue does sum.
 * Label it "customers of this location", never a share of the business total.
 */
export async function getLocationCustomerSegments(
  locationId: string,
): Promise<BusinessCustomerSegmentRow[]> {
  const data = await reportsClient().get<BusinessCustomerSegmentRow[]>(
    `${LOCATION_ANALYTICS_PREFIX}/${locationId}/customer-segments`,
  );
  return parseStringify(data);
}

export async function getLocationLifecycle(
  locationId: string,
): Promise<LocationLifecycleSnapshot | null> {
  try {
    const data = await reportsClient().get<LocationLifecycleSnapshot | null>(
      `${LOCATION_ANALYTICS_PREFIX}/${locationId}/lifecycle`,
    );
    return data ? parseStringify(data) : null;
  } catch (error: any) {
    // 404 = no rollup row yet (location created since the last nightly refresh).
    if (error?.status === 404) return null;
    throw error;
  }
}

/**
 * Batch lifecycle lookup — locationId → snapshot, for every id that has a
 * rollup row. Ids without one are omitted and the caller falls back to
 * "no data yet". Capped at 200 ids per call by the backend, which matches the
 * locations list's maximum page size.
 */
export async function getLocationLifecycleBatch(
  locationIds: string[],
): Promise<Record<string, LocationLifecycleSnapshot>> {
  if (locationIds.length === 0) return {};
  const data = await reportsClient().post<
    LocationLifecycleSnapshot[],
    { locationIds: string[] }
  >(`${LOCATION_ANALYTICS_PREFIX}/lifecycle-batch`, { locationIds });
  const list = parseStringify(data) as LocationLifecycleSnapshot[];
  const byId: Record<string, LocationLifecycleSnapshot> = {};
  for (const row of list) {
    if (row?.location_id) byId[row.location_id] = row;
  }
  return byId;
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
