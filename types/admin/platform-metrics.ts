import type { SubscriptionItemStatus } from "@/types/admin/billing";

/**
 * Platform-wide admin operations metrics, sourced from the Reports Service
 * internal endpoints under `/api/v2/internal/metrics/platform/**`. All money
 * is in TZS; all counts exclude internal/test accounts.
 */

/** Orders across every customer business within a date window. */
export interface PlatformOrders {
  startDate: string;
  endDate: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  grossSales: number;
  netSales: number;
  totalDiscount: number;
  grossProfit: number;
  activeBusinesses: number;
  activeLocations: number;
}

export interface PlatformAccountsDailyPoint {
  /** yyyy-MM-dd */
  date: string;
  count: number;
}

/** Accounts created within a window, plus a daily series for the sparkline. */
export interface PlatformAccounts {
  startDate: string;
  endDate: string;
  accountsCreated: number;
  businessCreated: number;
  locationLive: number;
  daily: PlatformAccountsDailyPoint[];
}

export interface StockMovementTypeRow {
  movementType: string;
  direction: string;
  count: number;
  totalQuantity: number;
  totalCost: number;
  totalQuantityAbs: number;
}

/** Inventory movement in/out (quantity + value) across all locations. */
export interface PlatformStockMovement {
  startDate: string;
  endDate: string;
  totalMovements: number;
  qtyIn: number;
  qtyOut: number;
  costIn: number;
  costOut: number;
  activeLocations: number;
  byType: StockMovementTypeRow[];
}

/**
 * One location with **its own** subscription state.
 *
 * Subscriptions are per-entity: Billing bills a business, but the thing that
 * carries a plan, a trial and an MRR is the SubscriptionItem — one per
 * location / store / warehouse. `status` is therefore the location's own
 * `SubscriptionItemStatus`, not the owning business's rollup.
 */
export interface PlatformLocationRow {
  locationId: string;
  locationName: string;
  businessId: string;
  businessName: string | null;
  region: string | null;
  /** The Billing subscription this location's item hangs off. */
  subscriptionId: string | null;
  status: SubscriptionItemStatus | null;
  /**
   * Derived, not stored: `SubscriptionItemStatus` has no TRIAL member. True
   * when the item is ACTIVE, has never been charged, and its trial window
   * hasn't elapsed.
   */
  isTrial: boolean;
  packageName: string | null;
  trialEndDate: string | null;
  paidThrough: string | null;
  /** This location's own contribution to MRR, in the business's currency. */
  monthlyAmount: number;
  /** Bundled units inherit the parent location's plan and aren't billed apart. */
  isBundled: boolean;
}

export interface PlatformLocationsPage {
  content: PlatformLocationRow[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PlatformLocationsQuery {
  status?: string;
  search?: string;
  page?: number;
  size?: number;
}
