"use client";

import { useMemo } from "react";

import { DataTable } from "@/components/tables/data-table";
import { Order } from "@/types/orders/type";
import { buildAbandonedColumns } from "./abandoned-columns";

interface AbandonedDataTableProps {
  data: Order[];
  pageCount: number;
  pageNo: number;
  total: number;
  /** Location runs a table-based ordering system. */
  tableMode: boolean;
  /** staffId → display name, scoped to the IDs on the visible page. */
  staffNames: Record<string, string>;
  /** tableId → table name, scoped to the IDs on the visible page. */
  tableNames: Record<string, string>;
}

/**
 * Client wrapper around DataTable for the Abandoned tab. Columns are
 * mode-aware (table-led vs order-led) and resolve staff/table UUIDs to
 * names, so they are built on the client.
 */
export function AbandonedDataTable({
  data,
  pageCount,
  pageNo,
  total,
  tableMode,
  staffNames,
  tableNames,
}: AbandonedDataTableProps) {
  const columns = useMemo(
    () => buildAbandonedColumns({ tableMode, staffNames, tableNames }),
    [tableMode, staffNames, tableNames],
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      pageCount={pageCount}
      pageNo={pageNo}
      searchKey="orderNumber"
      total={total}
      rowClickBasePath="/orders"
    />
  );
}
