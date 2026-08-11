"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type {
  LedgerDiscrepancy,
  StockMovement,
  StockMovementSummary,
  PageResponse,
  VariantMovementQuery,
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

/**
 * One page of the movement ledger for a single variant. Unlike
 * {@link getMovementsByVariant} this is driven from the client (the ledger's
 * filter bar and pager call it directly), so it takes an options object and
 * passes the type filters the backend already supports.
 */
export async function getVariantMovementsPage(
  q: VariantMovementQuery,
): Promise<PageResponse<StockMovement>> {
  const size = q.size ?? 50;
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
    const dates = resolveDates(q.startDate, q.endDate);
    const data = await apiClient.get(`/api/v2/analytics/stock-movements`, {
      params: {
        locationId: q.locationId,
        variantId: q.variantId,
        startDate: dates.start,
        endDate: dates.end,
        page: q.page ?? 0,
        size,
        ...(q.movementType && { movementType: q.movementType }),
        ...(q.referenceType && { referenceType: q.referenceType }),
      },
    });
    return parseStringify(data) as PageResponse<StockMovement>;
  } catch {
    return empty;
  }
}

/**
 * Every point in a variant's ledger where the running balance stops
 * reconciling, scanned server-side across the whole range.
 *
 * The dashboard can only check the rows it has loaded, so a break hundreds of
 * entries back was invisible without paging to it by hand. This finds them all
 * in one pass. Fails soft to an empty list — a scan that errors should not take
 * the ledger down with it.
 */
export async function getLedgerDiscrepancies(q: {
  locationId: string;
  variantId: string;
  startDate: string;
  endDate?: string;
  limit?: number;
}): Promise<LedgerDiscrepancy[]> {
  try {
    const apiClient = new ApiClient("reports");
    const dates = resolveDates(q.startDate, q.endDate);
    const data = await apiClient.get(
      `/api/v2/analytics/stock-movements/discrepancies`,
      {
        params: {
          locationId: q.locationId,
          variantId: q.variantId,
          startDate: dates.start,
          endDate: dates.end,
          limit: q.limit ?? 200,
        },
      },
    );
    const parsed = parseStringify(data);
    return Array.isArray(parsed) ? (parsed as LedgerDiscrepancy[]) : [];
  } catch {
    return [];
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
