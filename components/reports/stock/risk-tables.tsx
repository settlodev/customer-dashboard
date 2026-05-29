"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { forecastColumns } from "@/components/tables/reports/stock/forecast-columns";
import { reorderColumns } from "@/components/tables/reports/stock/reorder-columns";
import type {
  ReorderSuggestion,
  StockoutForecastItem,
} from "@/types/inventory-analytics/type";

interface ForecastProps {
  data: StockoutForecastItem[];
  pageCount: number;
  pageNo: number;
  total: number;
}

const RISK_FILTER_OPTIONS = [
  { label: "All", value: "" },
  { label: "Critical", value: "CRITICAL" },
  { label: "High", value: "HIGH" },
  { label: "Medium", value: "MEDIUM" },
  { label: "Low", value: "LOW" },
  { label: "No usage", value: "NO_CONSUMPTION" },
];

export function ForecastTable({
  data,
  pageCount,
  pageNo,
  total,
}: ForecastProps) {
  return (
    <Card>
      <CardContent className="px-2 pt-6 sm:px-6">
        <DataTable
          columns={forecastColumns}
          data={data}
          pageCount={pageCount}
          pageNo={pageNo}
          searchKey="variantName"
          total={total}
          filterKey="riskLevel"
          filterOptions={RISK_FILTER_OPTIONS}
        />
      </CardContent>
    </Card>
  );
}

interface ReorderProps {
  data: ReorderSuggestion[];
  pageCount: number;
  pageNo: number;
  total: number;
}

export function ReorderTable({
  data,
  pageCount,
  pageNo,
  total,
}: ReorderProps) {
  return (
    <Card>
      <CardContent className="px-2 pt-6 sm:px-6">
        <DataTable
          columns={reorderColumns}
          data={data}
          pageCount={pageCount}
          pageNo={pageNo}
          searchKey="variantName"
          total={total}
        />
      </CardContent>
    </Card>
  );
}
