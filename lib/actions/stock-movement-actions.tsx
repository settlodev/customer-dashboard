"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type {
  StockMovement,
  StockMovementSummary,
  PageResponse,
} from "@/types/stock-movement/type";

export async function getMovementsByLocation(
  locationId: string,
  startDate?: string,
  endDate?: string,
  page: number = 0,
  size: number = 100,
): Promise<PageResponse<StockMovement>> {
  const empty: PageResponse<StockMovement> = {
    content: [],
    page: 0,
    size,
    totalElements: 0,
    totalPages: 0,
    last: true,
  };
  try {
    const apiClient = new ApiClient("reports");
    const dates = resolveDates(startDate, endDate);
    const data = await apiClient.get(`/api/v2/analytics/stock-movements`, {
      params: {
        locationId,
        startDate: dates.start,
        endDate: dates.end,
        page,
        size,
      },
    });
    return parseStringify(data) as PageResponse<StockMovement>;
  } catch {
    return empty;
  }
}

export async function getMovementsByVariant(
  locationId: string,
  variantId: string,
  startDate?: string,
  endDate?: string,
  page: number = 0,
  size: number = 100,
): Promise<PageResponse<StockMovement>> {
  const empty: PageResponse<StockMovement> = {
    content: [],
    page: 0,
    size,
    totalElements: 0,
    totalPages: 0,
    last: true,
  };
  try {
    const apiClient = new ApiClient("reports");
    const dates = resolveDates(startDate, endDate);
    const data = await apiClient.get(`/api/v2/analytics/stock-movements`, {
      params: {
        locationId,
        variantId,
        startDate: dates.start,
        endDate: dates.end,
        page,
        size,
      },
    });
    return parseStringify(data) as PageResponse<StockMovement>;
  } catch {
    return empty;
  }
}

export async function getMovementSummaryByVariant(
  locationId: string,
  variantId?: string,
  startDate?: string,
  endDate?: string,
): Promise<StockMovementSummary | null> {
  try {
    const apiClient = new ApiClient("reports");
    const dates = resolveDates(startDate, endDate);
    const data = await apiClient.get(
      `/api/v2/analytics/stock-movements/summary`,
      {
        params: {
          locationId,
          startDate: dates.start,
          endDate: dates.end,
          ...(variantId && { variantId }),
        },
      },
    );
    return parseStringify(data) as StockMovementSummary;
  } catch {
    return null;
  }
}

function resolveDates(
  startDate?: string,
  endDate?: string,
): { start: string; end: string } {
  const now = new Date();
  const end = endDate ?? now.toISOString().split("T")[0];
  if (startDate) return { start: startDate, end };
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return { start: thirtyDaysAgo.toISOString().split("T")[0], end };
}
