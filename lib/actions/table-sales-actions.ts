"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { getCurrentLocation } from "./business/get-current-business";

/** One table's sales rollup from the Reports Service by-table report. */
export interface TableSalesAggregate {
  tableId: string;
  orders: number;
  gross: number;
  net: number;
  grossProfit: number;
}

export interface TableSalesReport {
  locationId: string;
  startDate: string;
  endDate: string;
  totalTables: number;
  totalOrders: number;
  totalGross: number;
  totalNet: number;
  totalGrossProfit: number;
  tables: TableSalesAggregate[];
}

/**
 * Sales aggregated by table for the period — served by the Reports Service
 * (`/api/v2/analytics/orders/by-table`), which groups closed orders by
 * `table_id`. Returns table ids + money; the caller joins the OMS tables
 * list for names. Only reflects orders ingested with a table since the
 * by-table column shipped — older orders need an ORDER_RESYNC to appear.
 */
export async function getSalesByTable(
  fromDate: string,
  toDate?: string,
): Promise<TableSalesReport | null> {
  try {
    const location = await getCurrentLocation();
    if (!location?.id) return null;

    const apiClient = new ApiClient("reports");
    const data = await apiClient.get(`/api/v2/analytics/orders/by-table`, {
      params: {
        locationId: location.id,
        fromDate,
        ...(toDate && { toDate }),
      },
    });
    return parseStringify(data) as TableSalesReport;
  } catch {
    return null;
  }
}
