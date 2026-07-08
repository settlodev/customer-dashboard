"use client";

import { useMemo } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { buildPackagingDepositColumns } from "@/components/tables/reports/packaging/deposit-columns";
import type { PackagingReportItem } from "@/types/packaging-report/type";

interface Props {
  data: PackagingReportItem[];
  currency: string;
}

/**
 * Client wrapper around the packaging-deposit DataTable.
 *
 * Column defs carry cell renderers, so they must be built on the client —
 * the server tab passes plain report rows and the location currency, and
 * this wrapper assembles the columns (same split as StockLevelsTable).
 *
 * The packaging report returns the full per-item snapshot in one call, so
 * the table runs in `clientMode`: pagination and search work in-memory
 * over the complete dataset.
 */
export function PackagingDepositTable({ data, currency }: Props) {
  const columns = useMemo(
    () => buildPackagingDepositColumns({ currency }),
    [currency],
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
