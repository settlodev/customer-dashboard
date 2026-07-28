"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ApiResponse } from "@/types/types";
import { UUID } from "node:crypto";
import { getCurrentLocation } from "./business/get-current-business";
import { OrderItemRefunds, RefundDetailsResponse } from "@/types/refunds/type";

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
export const GetRefundReport = async ({
  startDate,
  endDate,
  page = 0,
  size = 20,
}: {
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
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

  const report = await apiClient.get<RefundDetailsResponse>(
    `/api/v2/analytics/refunds/details?${queryParams.toString()}`,
  );
  return parseStringify(report);
};
