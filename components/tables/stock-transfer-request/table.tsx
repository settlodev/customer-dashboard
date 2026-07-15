"use client";

import { DataTable } from "@/components/tables/data-table";
import { getColumns } from "./column";
import type { TransferRequest } from "@/types/stock-transfer-request/type";

interface Props {
  data: TransferRequest[];
  /** The active destination's id — decides source vs requester for the status label. Resolved server-side and passed down since getColumns() can only run client-side. */
  activeDestinationId: string | null;
  pageNo: number;
  total: number;
  pageCount: number;
  defaultPageSize: number;
  filterOptions: { label: string; value: string }[];
}

export function TransferRequestTable({
  data,
  activeDestinationId,
  pageNo,
  total,
  pageCount,
  defaultPageSize,
  filterOptions,
}: Props) {
  return (
    <DataTable
      columns={getColumns({ activeDestinationId })}
      data={data}
      searchKey="requestNumber"
      pageNo={pageNo}
      total={total}
      pageCount={pageCount}
      defaultPageSize={defaultPageSize}
      filterKey="status"
      filterOptions={filterOptions}
      manualFilter
      rowClickBasePath="/stock-requests"
    />
  );
}
