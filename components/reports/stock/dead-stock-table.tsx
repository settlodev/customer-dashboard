"use client";

import { useMemo } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { buildDeadStockColumns } from "@/components/tables/reports/stock/dead-stock-columns";
import type { DeadStockItem } from "@/types/inventory-analytics/type";

interface Props {
  data: DeadStockItem[];
  pageCount: number;
  pageNo: number;
  total: number;
  currency: string;
}

export function DeadStockTable({
  data,
  pageCount,
  pageNo,
  total,
  currency,
}: Props) {
  const columns = useMemo(() => buildDeadStockColumns(currency), [currency]);

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
        />
      </CardContent>
    </Card>
  );
}
