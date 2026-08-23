"use server";

import { reportsInternalGet } from "@/lib/reports-internal-client";
import type { SubscriptionItemStatus } from "@/types/admin/billing";
import type {
  LocationLifecycleSummary,
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

/**
 * Restrict platform metrics to the accounts assigned to a sales/support staff
 * member. Omit (or pass {}) for admins/board → unrestricted, platform-wide.
 */
export interface StaffScope {
  assignedSalesStaffId?: string;
  assignedSupportStaffId?: string;
}

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
  scope?: StaffScope,
): Promise<PlatformOrders> {
  const r = await reportsInternalGet<Record<string, unknown>>(`${PREFIX}/orders`, {
    startDate,
    endDate,
    ...scope,
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
  scope?: StaffScope,
): Promise<PlatformAccounts> {
  const r = await reportsInternalGet<Record<string, unknown>>(
    `${PREFIX}/accounts`,
    { startDate, endDate, ...scope },
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
  scope?: StaffScope,
): Promise<PlatformStockMovement> {
  const r = await reportsInternalGet<Record<string, unknown>>(
    `${PREFIX}/stock-movements`,
    { startDate, endDate, ...scope },
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

/**
 * Pull the lifecycle half out of a location row, or null when the nightly
 * snapshot has nothing for it — a location created since the last refresh, or a
 * fresh environment whose first generation hasn't published. `lifecycle_stage`
 * is the marker: the join produces it for every row that has a snapshot and for
 * none that doesn't.
 *
 * `days_since_last_order` is left nullable on purpose. NULL means never traded;
 * V080 deliberately does not carry the business rollup's 9999 sentinel.
 */
function lifecycleOf(
  row: Record<string, unknown>,
): LocationLifecycleSummary | null {
  const stage = str(row.lifecycle_stage);
  if (!stage) return null;
  return {
    lifecycle_stage: stage,
    is_churned: nullableNum(row.is_churned),
    days_since_last_order: nullableNum(row.days_since_last_order),
    last_order_at: str(row.last_order_at),
    total_orders: nullableNum(row.total_orders),
    total_revenue: nullableNum(row.total_revenue),
  };
}

/** Like `num`, but preserves null rather than collapsing it to 0. */
function nullableNum(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function getPlatformLocations(
  query: PlatformLocationsQuery = {},
  scope?: StaffScope,
): Promise<PlatformLocationsPage> {
  const r = await reportsInternalGet<Record<string, unknown>>(
    `${PREFIX}/locations`,
    {
      status: query.status,
      search: query.search,
      page: query.page ?? 0,
      size: query.size ?? 20,
      ...scope,
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
      subscriptionId: str(row.subscription_id),
      // Per-location SubscriptionItemStatus — NOT the business's status.
      status: str(row.status) as SubscriptionItemStatus | null,
      // Billing has no TRIAL status; Reports derives it (ACTIVE + never paid +
      // a live trial window) and returns it as a 0/1 flag.
      isTrial: num(row.is_trial) === 1,
      packageName: str(row.package_name),
      trialEndDate: str(row.trial_end_date),
      paidThrough: str(row.paid_through),
      monthlyAmount: num(row.monthly_amount),
      isBundled: num(row.is_bundled) === 1,
      lifecycle: lifecycleOf(row),
    })),
    page: num(r.page),
    size: num(r.size) || (query.size ?? 20),
    totalElements: num(r.totalElements),
    totalPages: num(r.totalPages),
  };
}
