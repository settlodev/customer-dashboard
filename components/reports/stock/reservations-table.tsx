"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { reservationsColumns } from "@/components/tables/reports/stock/reservations-columns";
import type { StockReservation } from "@/types/stock-reservation/type";

const STATUS_FILTER_OPTIONS = [
  { label: "All", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Expired", value: "EXPIRED" },
  { label: "Released", value: "RELEASED" },
];

interface Props {
  data: StockReservation[];
  pageCount: number;
  pageNo: number;
  total: number;
}

/**
 * Reservations table — used by the stock report's Reservations tab.
 *
 * Paginated server-side: the parent server component fetches one page
 * at a time via `searchStockReservations(locationId, {page, size})`.
 * The DataTable's status filter mirrors the URL `status` param so the
 * server can re-query when the user toggles.
 */
export function ReservationsTable({ data, pageCount, pageNo, total }: Props) {
  return (
    <Card>
      <CardContent className="px-2 pt-6 sm:px-6">
        <DataTable
          columns={reservationsColumns}
          data={data}
          pageCount={pageCount}
          pageNo={pageNo}
          searchKey="stockVariantName"
          total={total}
          filterKey="status"
          filterOptions={STATUS_FILTER_OPTIONS}
        />
      </CardContent>
    </Card>
  );
}
