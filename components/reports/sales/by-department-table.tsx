"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import {
  buildSalesByDepartmentColumns,
  type DepartmentSalesRow,
} from "@/components/tables/reports/sales-by-department/columns";

interface Props {
  data: DepartmentSalesRow[];
  currency: string;
}

/**
 * Sales-by-department rollup table. The backend already aggregated to one row
 * per department (a handful of rows), so the table runs in `clientMode` —
 * search, sort and paging happen in-memory with no URL plumbing. Real
 * departments drill into their detail Sales tab; the "Unassigned" bucket has
 * no detail page, so its row isn't clickable.
 */
export function SalesByDepartmentTable({ data, currency }: Props) {
  const router = useRouter();
  const columns = useMemo(
    () => buildSalesByDepartmentColumns({ currency }),
    [currency],
  );

  return (
    <Card>
      <CardContent className="px-2 pt-6 sm:px-6">
        <DataTable
          columns={columns}
          data={data}
          searchKey="name"
          searchPlaceholder="Search departments…"
          clientMode
          onRowClick={(item) => {
            if (item.id && item.id !== "__unassigned__")
              router.push(`/departments/${item.id}?tab=sales`);
          }}
        />
      </CardContent>
    </Card>
  );
}
