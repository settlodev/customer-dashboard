"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type {
  RsBomRulesKpi,
  RsGrnKpi,
  RsInventoryDashboardSummary,
  RsItemSalesSummary,
  RsMovement,
  RsMovementSummary,
  RsPageResponse,
  RsProductsKpi,
  RsPurchaseOrderKpi,
  RsPurchaseRequisitionKpi,
  RsRfqKpi,
  RsStockIntakeKpi,
  RsStockModificationKpi,
  RsStockTakeKpi,
  RsStockTransferKpi,
  RsSupplierReturnKpi,
} from "@/types/reports-analytics/type";

/**
 * Reports Service wrappers scoped to a single stock variant. Whenever a data
 * shape lives in both services, we prefer the Reports Service — it owns
 * reporting and has materialised views sized for this traffic pattern.
 */

const ANALYTICS = "/api/v2/analytics";

export async function getMovementsForVariant(
  locationId: string,
  variantId: string,
  startDate: string,
  endDate: string,
  page = 0,
  size = 50,
  movementType?: string,
): Promise<RsPageResponse<RsMovement>> {
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({
      locationId,
      variantId,
      startDate,
      endDate,
      page: String(page),
      size: String(size),
    });
    if (movementType) params.set("movementType", movementType);
    const data = await apiClient.get(
      `${ANALYTICS}/stock-movements?${params.toString()}`,
    );
    return parseStringify(data) as RsPageResponse<RsMovement>;
  } catch {
    return {
      content: [],
      page: 0,
      size,
      totalElements: 0,
      totalPages: 0,
      last: true,
    };
  }
}

export async function getMovementSummaryForVariant(
  locationId: string,
  variantId: string,
  startDate: string,
  endDate: string,
): Promise<RsMovementSummary | null> {
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({
      locationId,
      variantId,
      startDate,
      endDate,
    });
    const data = await apiClient.get(
      `${ANALYTICS}/stock-movements/summary?${params.toString()}`,
    );
    return parseStringify(data) as RsMovementSummary;
  } catch {
    return null;
  }
}

/**
 * Location-wide movement summary (no variant filter). Used on the aggregate
 * stock report and as a fallback source when the inventory-service rollup is
 * not yet materialised.
 */
export async function getLocationMovementSummary(
  locationId: string,
  startDate: string,
  endDate: string,
): Promise<RsMovementSummary | null> {
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({
      locationId,
      startDate,
      endDate,
    });
    const data = await apiClient.get(
      `${ANALYTICS}/stock-movements/summary?${params.toString()}`,
    );
    return parseStringify(data) as RsMovementSummary;
  } catch {
    return null;
  }
}

/**
 * Item-sales summary for the location — the caller filters to variant IDs
 * owned by the current stock. The Reports Service endpoint doesn't accept a
 * variantId param (it returns everything and callers project).
 */
export async function getItemSalesSummary(
  locationId: string,
  startDate: string,
  endDate: string,
): Promise<RsItemSalesSummary | null> {
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({
      locationId,
      startDate,
      endDate,
    });
    const data = await apiClient.get(
      `${ANALYTICS}/item-sales/summary?${params.toString()}`,
    );
    return parseStringify(data) as RsItemSalesSummary;
  } catch {
    return null;
  }
}

/**
 * Six-tile inventory dashboard summary for the stock items list page.
 * Live current values come from `fact_inventory_current`; week-over-week and
 * 30-day deltas come from `fact_inventory_snapshot_daily`. Returns null on
 * transport/auth failure so the page can render placeholders rather than
 * blow up.
 */
export async function getInventoryDashboardSummary(
  locationId: string,
  currency?: string,
): Promise<RsInventoryDashboardSummary | null> {
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({ locationId });
    if (currency) params.set("currency", currency);
    const data = await apiClient.get(
      `${ANALYTICS}/inventory/dashboard/summary?${params.toString()}`,
    );
    return parseStringify(data) as RsInventoryDashboardSummary;
  } catch {
    return null;
  }
}

/**
 * Business-wide variant of the dashboard summary — aggregates the same six
 * tiles across every location belonging to the business. Powers the business
 * overview page.
 */
export async function getInventoryBusinessDashboardSummary(
  businessId: string,
  currency?: string,
): Promise<RsInventoryDashboardSummary | null> {
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({ businessId });
    if (currency) params.set("currency", currency);
    const data = await apiClient.get(
      `${ANALYTICS}/inventory/dashboard/business-summary?${params.toString()}`,
    );
    return parseStringify(data) as RsInventoryDashboardSummary;
  } catch {
    return null;
  }
}

/**
 * KPI strip data for the /stock-intakes page. Aggregates last-30d intake
 * counts + units received + workflow state from `fact_stock_intake`.
 */
export async function getStockIntakeKpi(
  locationId: string,
): Promise<RsStockIntakeKpi | null> {
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({ locationId });
    const data = await apiClient.get(
      `${ANALYTICS}/inventory/stock-management/stock-intakes/summary?${params.toString()}`,
    );
    return parseStringify(data) as RsStockIntakeKpi;
  } catch {
    return null;
  }
}

/** KPI strip for /stock-modifications. */
export async function getStockModificationKpi(
  locationId: string,
): Promise<RsStockModificationKpi | null> {
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({ locationId });
    const data = await apiClient.get(
      `${ANALYTICS}/inventory/stock-management/stock-modifications/summary?${params.toString()}`,
    );
    return parseStringify(data) as RsStockModificationKpi;
  } catch {
    return null;
  }
}

/** KPI strip for /stock-takes. */
export async function getStockTakeKpi(
  locationId: string,
): Promise<RsStockTakeKpi | null> {
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({ locationId });
    const data = await apiClient.get(
      `${ANALYTICS}/inventory/stock-management/stock-takes/summary?${params.toString()}`,
    );
    return parseStringify(data) as RsStockTakeKpi;
  } catch {
    return null;
  }
}

/** KPI strip for /stock-transfers. */
export async function getStockTransferKpi(
  locationId: string,
): Promise<RsStockTransferKpi | null> {
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({ locationId });
    const data = await apiClient.get(
      `${ANALYTICS}/inventory/stock-management/stock-transfers/summary?${params.toString()}`,
    );
    return parseStringify(data) as RsStockTransferKpi;
  } catch {
    return null;
  }
}

/** KPI strip for /bom-rules. */
export async function getBomRulesKpi(
  locationId: string,
): Promise<RsBomRulesKpi | null> {
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({ locationId });
    const data = await apiClient.get(
      `${ANALYTICS}/inventory/stock-management/bom-rules/summary?${params.toString()}`,
    );
    return parseStringify(data) as RsBomRulesKpi;
  } catch {
    return null;
  }
}

/** KPI strip for /purchase-requisitions. */
export async function getPurchaseRequisitionKpi(
  locationId: string,
): Promise<RsPurchaseRequisitionKpi | null> {
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({ locationId });
    const data = await apiClient.get(
      `${ANALYTICS}/inventory/stock-management/purchase-requisitions/summary?${params.toString()}`,
    );
    return parseStringify(data) as RsPurchaseRequisitionKpi;
  } catch {
    return null;
  }
}

/** KPI strip for /rfqs. */
export async function getRfqKpi(
  locationId: string,
): Promise<RsRfqKpi | null> {
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({ locationId });
    const data = await apiClient.get(
      `${ANALYTICS}/inventory/stock-management/rfqs/summary?${params.toString()}`,
    );
    return parseStringify(data) as RsRfqKpi;
  } catch {
    return null;
  }
}

/** KPI strip for /purchase-orders. */
export async function getPurchaseOrderKpi(
  locationId: string,
): Promise<RsPurchaseOrderKpi | null> {
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({ locationId });
    const data = await apiClient.get(
      `${ANALYTICS}/inventory/stock-management/purchase-orders/summary?${params.toString()}`,
    );
    return parseStringify(data) as RsPurchaseOrderKpi;
  } catch {
    return null;
  }
}

/** KPI strip for /goods-received. */
export async function getGrnKpi(
  locationId: string,
): Promise<RsGrnKpi | null> {
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({ locationId });
    const data = await apiClient.get(
      `${ANALYTICS}/inventory/stock-management/goods-received/summary?${params.toString()}`,
    );
    return parseStringify(data) as RsGrnKpi;
  } catch {
    return null;
  }
}

/** KPI strip for /supplier-returns. */
export async function getSupplierReturnKpi(
  locationId: string,
): Promise<RsSupplierReturnKpi | null> {
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({ locationId });
    const data = await apiClient.get(
      `${ANALYTICS}/inventory/stock-management/supplier-returns/summary?${params.toString()}`,
    );
    return parseStringify(data) as RsSupplierReturnKpi;
  } catch {
    return null;
  }
}

/** KPI strip for /products — location-scoped. */
export async function getProductsKpi(
  locationId: string,
  currency?: string,
): Promise<RsProductsKpi | null> {
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({ locationId });
    if (currency) params.set("currency", currency);
    const data = await apiClient.get(
      `${ANALYTICS}/inventory/product-overview/summary?${params.toString()}`,
    );
    return parseStringify(data) as RsProductsKpi;
  } catch {
    return null;
  }
}

/**
 * Business-wide variant of the products KPI strip — aggregates the same
 * four tiles across every location belonging to the business. Powers the
 * business overview page.
 */
export async function getProductsBusinessKpi(
  businessId: string,
  currency?: string,
): Promise<RsProductsKpi | null> {
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({ businessId });
    if (currency) params.set("currency", currency);
    const data = await apiClient.get(
      `${ANALYTICS}/inventory/product-overview/business-summary?${params.toString()}`,
    );
    return parseStringify(data) as RsProductsKpi;
  } catch {
    return null;
  }
}
