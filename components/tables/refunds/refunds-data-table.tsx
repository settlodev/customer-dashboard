"use client";

import { DataTable } from "@/components/tables/data-table";
import { refundColumns } from "@/components/tables/refunds/columns";
import { REFUND_REASON_FILTER_OPTIONS } from "@/types/reports/refunds";
import { RefundReportRow } from "@/types/refunds/type";

interface Props {
  data: RefundReportRow[];
  pageCount: number;
  pageNo: number;
  total: number;
  defaultPageSize: number;
}

/**
 * The `/refunds` list table. Search and the reason dropdown are both
 * URL-driven and resolved server-side by the Reports Service (`search` /
 * `reasonType` on `/refunds/details`), so `manualFilter` is on and the page
 * re-fetches rather than filtering the current page in memory — the same
 * contract the Orders table uses.
 */
export function RefundsDataTable({
  data,
  pageCount,
  pageNo,
  total,
  defaultPageSize,
}: Props) {
  return (
    <DataTable
      columns={refundColumns}
      data={data}
      pageCount={pageCount}
      pageNo={pageNo}
      total={total}
      defaultPageSize={defaultPageSize}
      searchKey="orderItemName"
      searchPlaceholder="Search refunded item…"
      filterKey="reason"
      filterOptions={REFUND_REASON_FILTER_OPTIONS}
      manualFilter
      rowClickBasePath="/refunds"
    />
  );
}
