"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { getCurrentLocation } from "./business/get-current-business";
import { RefundDetailsResponse } from "@/types/refunds/type";
import { RefundDashboard, RefundRecord } from "@/types/reports/refunds";

/**
 * One refund by id, for the refund detail page.
 *
 * <p>Sourced from the Reports Service, not the OMS: the retired monolith's
 * `POST /api/order-item-refunds/{locationId}` (which this used to call) no
 * longer exists behind the gateway, and the OMS only lists refunds per order
 * or per day session — neither can answer "this refund id".
 */
export const getRefundRecord = async (
  id: string,
): Promise<RefundRecord | null> => {
  const apiClient = new ApiClient("reports");
  const location = await getCurrentLocation();
  if (!location?.id) return null;

  const refund = await apiClient.get<RefundRecord>(
    `/api/v2/analytics/refunds/${id}?locationId=${location.id}`,
  );
  return parseStringify(refund);
};

/**
 * One page of refund details for a business-date range, server-paginated.
 *
 * <p>Hits `/refunds/details`, which returns a `RefundDetailsResponse` — the
 * current page's rows plus range-wide summary totals and paging metadata. Pass
 * `page`/`size` so the Reports service does the slicing (its default is only 20
 * rows); reading `totalElements`/`totalPages` off the response drives the pager.
 *
 * <p>Notes carried from the earlier fix: dates are `yyyy-MM-dd` (the endpoint
 * binds `LocalDate` and rejects a time component), and `locationId` is a
 * required query param — the `X-Location-Id` header ApiClient attaches does not
 * satisfy it.
 */
/**
 * The whole refunds dashboard for a business-date range in one read —
 * headline totals, the daily trend and the reason / refund-type / payback-
 * method / item / staff breakdowns.
 *
 * <p>One call rather than one per panel: every panel aggregates the same
 * `fact_refunds` slice server-side, so a single request keeps them consistent
 * with each other and with the KPI strip.
 *
 * <p>Same binding rules as {@link GetRefundReport}: `yyyy-MM-dd` dates (the
 * endpoint binds `LocalDate` and rejects a time component) and an explicit
 * `locationId` query param — the `X-Location-Id` header does not satisfy it.
 */
export const getRefundDashboard = async ({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate?: string;
}): Promise<RefundDashboard | null> => {
  const apiClient = new ApiClient("reports");
  const location = await getCurrentLocation();
  if (!location?.id) return null;

  const queryParams = new URLSearchParams();
  queryParams.append("locationId", location.id);
  queryParams.append("startDate", startDate);
  if (endDate) queryParams.append("endDate", endDate);

  const dashboard = await apiClient.get<RefundDashboard>(
    `/api/v2/analytics/refunds/dashboard?${queryParams.toString()}`,
  );
  return parseStringify(dashboard);
};

export const GetRefundReport = async ({
  startDate,
  endDate,
  page = 0,
  size = 20,
  search,
  reasonType,
}: {
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
  /** Case-insensitive match on the refunded item's name. */
  search?: string;
  /** `RefundReason` code — CUSTOMER_REQUEST, DAMAGED, … */
  reasonType?: string;
}): Promise<RefundDetailsResponse | null> => {
  const apiClient = new ApiClient("reports");
  const location = await getCurrentLocation();
  if (!location?.id) return null;

  const queryParams = new URLSearchParams();
  queryParams.append("locationId", location.id);
  if (startDate) queryParams.append("startDate", startDate);
  if (endDate) queryParams.append("endDate", endDate);
  queryParams.append("page", String(page));
  queryParams.append("size", String(size));
  // The summary totals on the response follow these filters, so the list's
  // KPI strip always describes the rows actually shown.
  if (search?.trim()) queryParams.append("search", search.trim());
  if (reasonType) queryParams.append("reasonType", reasonType);

  const report = await apiClient.get<RefundDetailsResponse>(
    `/api/v2/analytics/refunds/details?${queryParams.toString()}`,
  );
  return parseStringify(report);
};
