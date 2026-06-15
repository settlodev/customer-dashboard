"use server";

import { reportsInternalGet } from "@/lib/reports-internal-client";
import type { SubscriptionStatus } from "@/types/admin/billing";
import type {
  PlatformAccounts,
  PlatformLocationsPage,
  PlatformLocationsQuery,
  PlatformOrders,
  PlatformStockMovement,
} from "@/types/admin/platform-metrics";

/**
 * Server-only readers for the platform operations metrics. Each hits a Reports
 * Service internal endpoint via {@link reportsInternalGet} (X-Internal-Secret,
 * server-held) and maps the raw snake_case ClickHouse row into the typed UI
 * shape. Callers wrap these in `Promise.allSettled` so a single failing metric
 * renders a "couldn't load" card instead of taking the page down.
 */

const PREFIX = "/api/v2/internal/metrics/platform";

/** Coerce a possibly-string ClickHouse scalar to a finite number. */
function num(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Non-empty string, or null. */
function str(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value);
  return s === "" ? null : s;
}

export async function getPlatformOrders(
  startDate: string,
  endDate: string,
): Promise<PlatformOrders> {
  const r = await reportsInternalGet<Record<string, unknown>>(`${PREFIX}/orders`, {
    startDate,
    endDate,
  });
  return {
    startDate,
    endDate,
    totalOrders: num(r.total_orders),
    completedOrders: num(r.completed_orders),
    cancelledOrders: num(r.cancelled_orders),
    refundedOrders: num(r.refunded_orders),
    grossSales: num(r.gross_sales),
    netSales: num(r.net_sales),
    totalDiscount: num(r.total_discount),
    grossProfit: num(r.gross_profit),
    activeBusinesses: num(r.active_businesses),
    activeLocations: num(r.active_locations),
  };
}

export async function getPlatformAccounts(
  startDate: string,
  endDate: string,
): Promise<PlatformAccounts> {
  const r = await reportsInternalGet<Record<string, unknown>>(
    `${PREFIX}/accounts`,
    { startDate, endDate },
  );
  const daily = Array.isArray(r.daily)
    ? (r.daily as Record<string, unknown>[]).map((p) => ({
        date: String(p.d ?? ""),
        count: num(p.c),
      }))
    : [];
  return {
    startDate,
    endDate,
    accountsCreated: num(r.accounts_created),
    businessCreated: num(r.business_created),
    locationLive: num(r.location_live),
    daily,
  };
}

export async function getPlatformStockMovement(
  startDate: string,
  endDate: string,
): Promise<PlatformStockMovement> {
  const r = await reportsInternalGet<Record<string, unknown>>(
    `${PREFIX}/stock-movements`,
    { startDate, endDate },
  );
  const byType = Array.isArray(r.byType)
    ? (r.byType as Record<string, unknown>[]).map((t) => ({
        movementType: String(t.movement_type ?? ""),
        direction: String(t.direction ?? ""),
        count: num(t.cnt),
        totalQuantity: num(t.total_quantity),
        totalCost: num(t.total_cost),
        totalQuantityAbs: num(t.total_quantity_abs),
      }))
    : [];
  return {
    startDate,
    endDate,
    totalMovements: num(r.total_movements),
    qtyIn: num(r.qty_in),
    qtyOut: num(r.qty_out),
    costIn: num(r.cost_in),
    costOut: num(r.cost_out),
    activeLocations: num(r.active_locations),
    byType,
  };
}

export async function getPlatformLocations(
  query: PlatformLocationsQuery = {},
): Promise<PlatformLocationsPage> {
  const r = await reportsInternalGet<Record<string, unknown>>(
    `${PREFIX}/locations`,
    {
      status: query.status,
      search: query.search,
      page: query.page ?? 0,
      size: query.size ?? 20,
    },
  );
  const rows = Array.isArray(r.content)
    ? (r.content as Record<string, unknown>[])
    : [];
  return {
    content: rows.map((row) => ({
      locationId: String(row.location_id ?? ""),
      locationName: String(row.location_name ?? ""),
      businessId: String(row.business_id ?? ""),
      businessName: str(row.business_name),
      region: str(row.region),
      status: str(row.status) as SubscriptionStatus | null,
      packageName: str(row.package_name),
      trialEndDate: str(row.trial_end_date),
    })),
    page: num(r.page),
    size: num(r.size) || (query.size ?? 20),
    totalElements: num(r.totalElements),
    totalPages: num(r.totalPages),
  };
}
