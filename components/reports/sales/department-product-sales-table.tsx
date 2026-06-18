"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { DataTable } from "@/components/tables/data-table";
import {
  buildDepartmentProductSalesColumns,
  type DepartmentProductSale,
} from "@/components/tables/reports/department-product-sales/columns";

interface Props {
  data: DepartmentProductSale[];
  currency: string;
}

/**
 * Products-in-department sales table for the department detail Sales tab.
 * The full set is already in memory (the parent fetched every product), so
 * the table runs in `clientMode` — search, pagination and column ordering
 * all happen in-memory and never touch the URL, leaving the `?from`/`?to`
 * date filter as the only URL-driven control. Rows drill into the product.
 */
export function DepartmentProductSalesTable({ data, currency }: Props) {
  const router = useRouter();
  const columns = useMemo(
    () => buildDepartmentProductSalesColumns({ currency }),
    [currency],
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="name"
      searchPlaceholder="Search products…"
      clientMode
      onRowClick={(item) => {
        if (item.productId)
          router.push(`/products/${item.productId}?tab=sales`);
      }}
    />
  );
}
