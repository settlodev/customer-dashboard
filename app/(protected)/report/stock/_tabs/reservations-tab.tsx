import { Lock } from "lucide-react";

import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { ReservationsTable } from "@/components/reports/stock/reservations-table";
import { getCurrentDestination } from "@/lib/actions/context";
import { searchStockReservations } from "@/lib/actions/stock-reservation-actions";
import type {
  StockReservationPage,
  StockReservationStatus,
} from "@/types/stock-reservation/type";

interface Props {
  page: number;
  limit: number;
  /** Optional status filter from the URL. */
  status: string;
}

const VALID_STATUSES: StockReservationStatus[] = [
  "ACTIVE",
  "EXPIRED",
  "RELEASED",
];

const fmt = (value: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);

/**
 * Reservations — server-paged.
 *
 * The reservations endpoint is page+size; passing the URL `page`/`limit`
 * straight through means we never pull more than the visible row count
 * over the wire. Locations with thousands of orders should still feel
 * snappy.
 */
export async function ReservationsTab({ page, limit, status }: Props) {
  // Follow the active destination (location OR store), not just the location —
  // in store mode getCurrentLocation() is null, which would blank the report.
  const destination = await getCurrentDestination();
  const locationId = destination?.id ?? null;
  const effectiveStatus = VALID_STATUSES.includes(
    status as StockReservationStatus,
  )
    ? (status as StockReservationStatus)
    : undefined;

  const result: StockReservationPage = locationId
    ? await searchStockReservations(locationId, {
        page: page - 1,
        size: limit,
        status: effectiveStatus,
      })
    : {
        content: [],
        number: 0,
        size: 0,
        totalElements: 0,
        totalPages: 0,
        last: true,
      };

  if (result.totalElements === 0 && !effectiveStatus) {
    return <NoItems itemName="reservations" />;
  }

  return (
    <>
      <KpiStrip cols={2}>
        <KpiCard
          icon={<Lock className="h-3 w-3" />}
          label="Reservations on this page"
          value={fmt(result.content.length)}
          delta={`Page ${result.number + 1} of ${Math.max(1, result.totalPages)}`}
          deltaTone="neutral"
        />
        <KpiCard
          icon={<Lock className="h-3 w-3" />}
          label={effectiveStatus ? `Matching ${effectiveStatus.toLowerCase()}` : "Total"}
          value={result.totalElements > 0 ? fmt(result.totalElements) : "—"}
          delta="Across all pages"
          deltaTone="neutral"
        />
      </KpiStrip>

      <ReservationsTable
        data={result.content}
        pageCount={Math.max(1, result.totalPages)}
        pageNo={result.number}
        total={result.totalElements}
      />
    </>
  );
}
