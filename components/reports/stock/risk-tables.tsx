"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { forecastColumns } from "@/components/tables/reports/stock/forecast-columns";
import { reorderColumns } from "@/components/tables/reports/stock/reorder-columns";
import type {
  ReorderSuggestion,
  StockoutForecastItem,
} from "@/types/inventory-analytics/type";

const RISK_FILTER_OPTIONS = [
  { label: "All", value: "" },
  { label: "Critical", value: "CRITICAL" },
  { label: "High", value: "HIGH" },
  { label: "Medium", value: "MEDIUM" },
  { label: "Low", value: "LOW" },
  { label: "No usage", value: "NO_CONSUMPTION" },
];

/**
 * Both Risk-tab tables run in `clientMode`: the analytics endpoints return
 * the full (capped) result set in one call, and two tables share this one
 * route — so neither can own the URL's `?page`/`?search`. Pagination,
 * search, and the risk filter all run in-memory over the complete set.
 */

export function ForecastTable({ data }: { data: StockoutForecastItem[] }) {
  return (
    <Card>
      <CardContent className="px-2 pt-6 sm:px-6">
        <DataTable
          columns={forecastColumns}
          data={data}
          searchKey="variantName"
          filterKey="riskLevel"
          filterOptions={RISK_FILTER_OPTIONS}
          clientMode
        />
      </CardContent>
    </Card>
  );
}

export function ReorderTable({ data }: { data: ReorderSuggestion[] }) {
  return (
    <Card>
      <CardContent className="px-2 pt-6 sm:px-6">
        <DataTable
          columns={reorderColumns}
          data={data}
          searchKey="variantName"
          clientMode
        />
      </CardContent>
    </Card>
  );
}
