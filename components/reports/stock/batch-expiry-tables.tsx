"use client";

import { useMemo } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { buildExpiredBatchColumns } from "@/components/tables/reports/stock/expired-batch-columns";
import { buildExpiringBatchColumns } from "@/components/tables/reports/stock/expiring-batch-columns";
import type { StockBatch } from "@/types/stock-batch/type";

interface Props {
  data: StockBatch[];
  pageCount: number;
  pageNo: number;
  total: number;
  currency: string;
}

/**
 * Expiring-soon table — wraps `DataTable` with the expiring columns.
 *
 * `today` is memoised so each render in a single SSR pass uses the same
 * anchor for "days until expiry" calculations.
 */
export function ExpiringBatchesTable({
  data,
  pageCount,
  pageNo,
  total,
  currency,
}: Props) {
  const today = useMemo(() => new Date(), []);
  const columns = useMemo(
    () => buildExpiringBatchColumns(currency, today),
    [currency, today],
  );

  return (
    <Card>
      <CardContent className="px-2 pt-6 sm:px-6">
        <DataTable
          columns={columns}
          data={data}
          pageCount={pageCount}
          pageNo={pageNo}
          searchKey="variantName"
          total={total}
        />
      </CardContent>
    </Card>
  );
}

export function ExpiredBatchesTable({
  data,
  pageCount,
  pageNo,
  total,
  currency,
}: Props) {
  const today = useMemo(() => new Date(), []);
  const columns = useMemo(
    () => buildExpiredBatchColumns(currency, today),
    [currency, today],
  );

  return (
    <Card>
      <CardContent className="px-2 pt-6 sm:px-6">
        <DataTable
          columns={columns}
          data={data}
          pageCount={pageCount}
          pageNo={pageNo}
          searchKey="variantName"
          total={total}
        />
      </CardContent>
    </Card>
  );
}
