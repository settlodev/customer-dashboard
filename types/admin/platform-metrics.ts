import type { SubscriptionStatus } from "@/types/admin/billing";

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

/** One location with its business's latest subscription status. */
export interface PlatformLocationRow {
  locationId: string;
  locationName: string;
  businessId: string;
  businessName: string | null;
  region: string | null;
  status: SubscriptionStatus | null;
  packageName: string | null;
  trialEndDate: string | null;
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
