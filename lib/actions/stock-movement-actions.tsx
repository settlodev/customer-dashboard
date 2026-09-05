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

/** Rows per request when draining a ledger for export. */
const EXPORT_PAGE_SIZE = 1000;
/** Hard ceiling on an export — past this the caller is told to narrow the period. */
const EXPORT_MAX_ROWS = 50_000;

export interface VariantMovementExport {
  /** Every matching row, newest first — the same order the ledger pages in. */
  rows: StockMovement[];
  /** True when the ledger has more rows than {@link EXPORT_MAX_ROWS}; `rows` holds the newest. */
  truncated: boolean;
}

/**
 * Every movement matching a variant ledger query, not just one page of it.
 * Backs the ledger's CSV export, which must contain the whole filtered
 * history rather than the page on screen.
 *
 * Unlike the page fetchers above this one THROWS on failure: an export that
 * quietly came back empty would be downloaded and trusted, whereas an empty
 * page just renders as "no movements".
 */
export async function getVariantMovementsAll(
  q: Omit<VariantMovementQuery, "page" | "size">,
): Promise<VariantMovementExport> {
  const apiClient = new ApiClient("reports");
  const dates = resolveDates(q.startDate, q.endDate);
  const rows: StockMovement[] = [];
  for (let page = 0; ; page++) {
    const data = parseStringify(
      await apiClient.get(`/api/v2/analytics/stock-movements`, {
        params: {
          locationId: q.locationId,
          variantId: q.variantId,
          startDate: dates.start,
          endDate: dates.end,
          page,
          size: EXPORT_PAGE_SIZE,
          ...(q.movementType && { movementType: q.movementType }),
          ...(q.referenceType && { referenceType: q.referenceType }),
        },
      }),
    ) as PageResponse<StockMovement>;
    rows.push(...data.content);
    if (data.last || data.content.length === 0) {
      return { rows, truncated: false };
    }
    if (rows.length >= EXPORT_MAX_ROWS) {
      return { rows: rows.slice(0, EXPORT_MAX_ROWS), truncated: true };
    }
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
