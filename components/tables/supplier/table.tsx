"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/tables/data-table";
import { getColumns } from "./columns";
import type { Supplier } from "@/types/supplier/type";

interface Props {
  data: Supplier[];
  /**
   * The business's suppliers whose latest marketplace nomination is
   * `SUBMITTED` — resolved server-side (one bulk fetch) and passed down
   * since getColumns() can only run client-side.
   */
  underReviewSupplierIds: Set<string>;
  pageCount: number;
  defaultPageSize: number;
  pageNo: number;
  total: number;
}

export function SupplierTable({
  data,
  underReviewSupplierIds,
  pageCount,
  defaultPageSize,
  pageNo,
  total,
}: Props) {
  const columns = useMemo(
    () => getColumns({ underReviewSupplierIds }),
    [underReviewSupplierIds],
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      pageCount={pageCount}
      defaultPageSize={defaultPageSize}
      pageNo={pageNo}
      searchKey="name"
      total={total}
      rowClickBasePath="/suppliers"
      disableArchive
    />
  );
}
