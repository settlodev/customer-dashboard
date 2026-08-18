"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import {
  buildSalesByCategoryColumns,
  type CategorySalesRow,
} from "@/components/tables/reports/sales-by-category/columns";

interface Props {
  data: CategorySalesRow[];
  currency: string;
}

/**
 * Sales-by-category rollup table. The backend already aggregated to one row
 * per category, so the table runs in `clientMode` — search, sort and paging
 * happen in-memory with no URL plumbing. Rows drill into the category detail
 * Sales tab.
 */
export function SalesByCategoryTable({ data, currency }: Props) {
  const router = useRouter();
  const columns = useMemo(
    () => buildSalesByCategoryColumns({ currency }),
    [currency],
  );

  return (
    <Card>
      <CardContent className="px-2 pt-6 sm:px-6">
        <DataTable
          columns={columns}
          data={data}
          searchKey="name"
          searchPlaceholder="Search categories…"
          clientMode
          onRowClick={(item) => {
            if (item.id) router.push(`/categories/${item.id}?tab=sales`);
          }}
        />
      </CardContent>
    </Card>
  );
}
