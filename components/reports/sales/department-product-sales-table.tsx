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
  pageCount: number;
  pageNo: number;
  total: number;
}

/**
 * Items-in-department table for the department detail Sales tab. A single
 * department can hold thousands of sold items, so this runs **server-side**:
 * the page (`?page`/`?limit`/`?sort`/`?search`) drives a ClickHouse query and
 * only the current page is ever in memory. `manualSort` pushes sorting to the
 * backend; the search box pushes `?search`. Rows drill into the product.
 */
export function DepartmentProductSalesTable({
  data,
  currency,
  pageCount,
  pageNo,
  total,
}: Props) {
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
      searchPlaceholder="Search items…"
      manualSort
      pageCount={pageCount}
      pageNo={pageNo}
      total={total}
      onRowClick={(item) => {
        if (item.productId)
          router.push(`/products/${item.productId}?tab=sales`);
      }}
    />
  );
}
