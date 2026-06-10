"use client";

import { useMemo } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { buildExpiredBatchColumns } from "@/components/tables/reports/stock/expired-batch-columns";
import { buildExpiringBatchColumns } from "@/components/tables/reports/stock/expiring-batch-columns";
import type { StockBatch } from "@/types/stock-batch/type";

interface Props {
  data: StockBatch[];
  currency: string;
}

/**
 * Expiring-soon table — wraps `DataTable` with the expiring columns.
 *
 * Runs in `clientMode`: the aging tab loads the full (capped) batch set in
 * one call and stacks several tables on one route, so pagination and search
 * run in-memory here rather than fighting over a shared URL. `today` is
 * memoised so each render in a single pass uses the same anchor for
 * "days until expiry".
 */
export function ExpiringBatchesTable({ data, currency }: Props) {
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
          searchKey="variantName"
          clientMode
        />
      </CardContent>
    </Card>
  );
}

export function ExpiredBatchesTable({ data, currency }: Props) {
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
          searchKey="variantName"
          clientMode
        />
      </CardContent>
    </Card>
  );
}
