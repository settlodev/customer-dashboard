"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import {
  buildSalesByTableColumns,
  type TableSalesRow,
} from "@/components/tables/reports/sales-by-table/columns";

interface Props {
  data: TableSalesRow[];
  pageCount: number;
  pageNo: number;
  total: number;
  currency: string;
}

/**
 * Client wrapper around the data-table for the sales-by-table summary.
 * Each row drills into that table's detail screen, landing on the Sales
 * tab (`?tab=sales`).
 */
export function SalesByTableTable({
  data,
  pageCount,
  pageNo,
  total,
  currency,
}: Props) {
  const router = useRouter();
  const columns = useMemo(
    () => buildSalesByTableColumns({ currency }),
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
          searchKey="name"
          total={total}
          onRowClick={(item) => {
            if (item.id) router.push(`/tables/${item.id}?tab=sales`);
          }}
        />
      </CardContent>
    </Card>
  );
}
