"use client";

import { useMemo } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { buildDeadStockColumns } from "@/components/tables/reports/stock/dead-stock-columns";
import type { DeadStockItem } from "@/types/inventory-analytics/type";

interface Props {
  data: DeadStockItem[];
  currency: string;
}

/**
 * Dead-stock table — runs in `clientMode` (full set loaded in one call,
 * shares the aging route with sibling tables), so pagination and search
 * work in-memory over every row.
 */
export function DeadStockTable({ data, currency }: Props) {
  const columns = useMemo(() => buildDeadStockColumns(currency), [currency]);

  return (
    <Card>
      <CardContent className="px-2 pt-6 sm:px-6">
        <DataTable
          columns={columns}
          data={data}
          searchKey="variantName"
          clientMode
        />
      </CardContent>
    </Card>
  );
}
