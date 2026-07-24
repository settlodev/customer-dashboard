"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ApiResponse } from "@/types/types";
import { UUID } from "node:crypto";
import { getCurrentLocation } from "./business/get-current-business";
import { OrderItemRefunds, RefundReport } from "@/types/refunds/type";

export const searchOrderItemRefunds = async (
  q: string,
  page: number,
  pageLimit: number,
): Promise<ApiResponse<OrderItemRefunds>> => {
  try {
    const apiClient = new ApiClient();
    const query = {
      filters: [
        {
          key: "orderItem.name",
          operator: "LIKE",
          field_type: "STRING",
          value: q,
        },
      ],
      sorts: [
        {
          key: "dateOfReturn",
          direction: "DESC",
        },
      ],
      page: page ? page - 1 : 0,
      size: pageLimit ? pageLimit : 10,
    };
    const location = await getCurrentLocation();
    // console.log("The location passed is: ", location)
    const refunds = await apiClient.post(
      `/api/order-item-refunds/${location?.id}`,
      query,
    );
    // console.log("The list of refunds in this location: ", refunds)
    return parseStringify(refunds);
  } catch (error) {
    throw error;
  }
};
export const getRefund = async (
  id: UUID,
): Promise<ApiResponse<OrderItemRefunds>> => {
  const apiClient = new ApiClient();
  const query = {
    filters: [
      {
        key: "id",
        operator: "EQUAL",
        field_type: "UUID_STRING",
        value: id,
      },
    ],
    sorts: [],
    page: 0,
    size: 1,
  };
  const location = await getCurrentLocation();
  const refund = await apiClient.post(
    `/api/order-item-refunds/${location?.id}`,
    query,
  );
  return parseStringify(refund);
};

/**
 * Refund details for a business-date range.
 *
 * <p>`startDate`/`endDate` are `yyyy-MM-dd` — `/refunds/details` binds them as
 * `LocalDate` with `@DateTimeFormat(iso = ISO.DATE)`, which rejects anything
 * carrying a time component. Callers used to hand it
 * `new Date(...).toISOString()`, so every request 400'd and the page's
 * `.catch(() => null)` rendered an empty report instead of an error.
 *
 * <p>`locationId` is a required query param on that endpoint and was missing
 * too — the `X-Location-Id` header ApiClient attaches does not satisfy it. So
 * the request had two independent reasons to fail; fixing only the dates would
 * have left the report just as empty.
 */
export const GetRefundReport = async (
  startDate?: string,
  endDate?: string,
): Promise<RefundReport> => {
  try {
    const apiClient = new ApiClient("reports");
    const location = await getCurrentLocation();
    const queryParams = new URLSearchParams();

    if (location?.id) queryParams.append("locationId", location.id);
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);

    const queryString = queryParams.toString();
    const url = `/api/v2/analytics/refunds/details${queryString ? `?${queryString}` : ""}`;
    const report = await apiClient.get(url);

    return parseStringify(report);
  } catch (error) {
    throw error;
  }
};
