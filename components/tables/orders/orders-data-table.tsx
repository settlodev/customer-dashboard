"use client";

import { useMemo } from "react";

import { DataTable } from "@/components/tables/data-table";
import {
  Order,
  ORDER_STATUS_FILTER_OPTIONS,
  OrderStatus,
} from "@/types/orders/type";
import { buildOrdersColumns } from "./columns";

// Abandoned orders live on their own tab and are stripped from this
// list, so offering "Abandoned" here would only ever yield an empty
// result — drop it from the status filter.
const ORDERS_TAB_FILTER_OPTIONS = ORDER_STATUS_FILTER_OPTIONS.filter(
  (o) => o.value !== OrderStatus.ABANDONED,
);

interface OrdersDataTableProps {
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
 * Client wrapper around DataTable for the Orders tab. Columns are
 * mode-aware (table-led vs order-led) and resolve staff/table UUIDs to
 * names, so they have to be built on the client — the server can't
 * invoke the factory across the "use client" boundary.
 */
export function OrdersDataTable({
  data,
  pageCount,
  pageNo,
  total,
  tableMode,
  staffNames,
  tableNames,
}: OrdersDataTableProps) {
  const columns = useMemo(
    () => buildOrdersColumns({ tableMode, staffNames, tableNames }),
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
      filterOptions={ORDERS_TAB_FILTER_OPTIONS}
      rowClickBasePath="/orders"
    />
  );
}
