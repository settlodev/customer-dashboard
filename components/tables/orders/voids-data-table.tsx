"use client";

import { useMemo } from "react";

import { DataTable } from "@/components/tables/data-table";
import {
  Order,
  ORDER_STATUS_FILTER_OPTIONS,
  OrderStatus,
} from "@/types/orders/type";
import { buildVoidsColumns } from "./voids-columns";

// Abandoned orders never have voided items, so drop ABANDONED from the filter.
const VOIDS_FILTER_OPTIONS = ORDER_STATUS_FILTER_OPTIONS.filter(
  (o) => o.value !== OrderStatus.ABANDONED,
);

interface VoidsDataTableProps {
  data: Order[];
  pageCount: number;
  pageNo: number;
  total: number;
  tableMode: boolean;
  staffNames: Record<string, string>;
  tableNames: Record<string, string>;
}

export function VoidsDataTable({
  data,
  pageCount,
  pageNo,
  total,
  tableMode,
  staffNames,
  tableNames,
}: VoidsDataTableProps) {
  const columns = useMemo(
    () => buildVoidsColumns({ tableMode, staffNames, tableNames }),
    [tableMode, staffNames, tableNames],
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      pageCount={pageCount}
      pageNo={pageNo}
      searchKey="orderNumber"
      searchPlaceholder="Search order #, table, staff…"
      total={total}
      filterKey="orderStatus"
      filterOptions={VOIDS_FILTER_OPTIONS}
      rowClickBasePath="/orders"
    />
  );
}
