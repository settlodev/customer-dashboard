"use client";

import { useMemo } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { buildLevelsColumns } from "@/components/tables/reports/stock/levels-columns";
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
  pageCount: number;
  pageNo: number;
  total: number;
  currency: string;
}

/**
 * Client wrapper around the stock-levels DataTable.
 *
 * Filters are client-side because the inventory-balance endpoint returns
 * the full per-location balance set in one call — the page server-side
 * filters by search / status and paginates the result before passing
 * the slice in. The DataTable's built-in `filterKey` provides the
 * status dropdown UI; the page server-trip is what handles the URL sync.
 */
export function StockLevelsTable({
  data,
  pageCount,
  pageNo,
  total,
  currency,
}: Props) {
  const columns = useMemo(
    () => buildLevelsColumns({ currency }),
    [currency],
  );

  return (
    <Card>
      <CardContent className="px-2 pt-6 sm:px-6">
        <DataTable
          columns={columns}
          data={data}
          pageCount={pageCount}
          pageNo={pageNo}
          searchKey="variantName"
          total={total}
          filterKey="__status"
          filterOptions={STATUS_FILTER_OPTIONS}
        />
      </CardContent>
    </Card>
  );
}
