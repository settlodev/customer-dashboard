"use client";

import { useMemo } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import {
  buildLevelsColumns,
  deriveLevelStatus,
} from "@/components/tables/reports/stock/levels-columns";
import type { InventoryBalance } from "@/types/inventory-balance/type";

const STATUS_FILTER_OPTIONS = [
  { label: "All", value: "" },
  { label: "Out of stock", value: "OUT" },
  { label: "Low stock", value: "LOW" },
  { label: "Overstock", value: "OVERSTOCK" },
  { label: "OK", value: "OK" },
];

interface Props {
  data: InventoryBalance[];
  currency: string;
}

/**
 * Client wrapper around the stock-levels DataTable.
 *
 * The inventory-balance endpoint returns the full per-location balance set
 * in one call, so the table runs in `clientMode`: pagination, search, and
 * the status filter all work in-memory over the complete dataset — no
 * server round-trip per page, and the status filter spans every row rather
 * than just the visible page.
 *
 * Status is derived (out/low/overstock/ok), not a stored field, so we
 * project it onto each row as `__status` for the filter dropdown to match.
 */
export function StockLevelsTable({ data, currency }: Props) {
  const columns = useMemo(() => buildLevelsColumns({ currency }), [currency]);

  const rows = useMemo(
    () => data.map((b) => ({ ...b, __status: deriveLevelStatus(b) })),
    [data],
  );

  return (
    <Card>
      <CardContent className="px-2 pt-6 sm:px-6">
        <DataTable
          columns={columns}
          data={rows}
          searchKey="variantName"
          filterKey="__status"
          filterOptions={STATUS_FILTER_OPTIONS}
          clientMode
        />
      </CardContent>
    </Card>
  );
}
