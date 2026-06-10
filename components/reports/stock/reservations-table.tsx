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
 * Paginated server-side: the parent fetches one page at a time via
 * `searchStockReservations(locationId, {page, size, status})`. The status
 * filter runs in `manualFilter` mode so toggling it pushes `?status=…` to
 * the URL and the server re-queries the full filtered set (not just the
 * visible page). Search is hidden — the reservations endpoint has no
 * free-text search, so a box that silently did nothing was removed.
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
          manualFilter
          hideSearch
        />
      </CardContent>
    </Card>
  );
}
