"use client";

import { useMemo } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { buildZReportColumns } from "@/components/tables/reports/z-report/columns";
import type { ZReportDayRow } from "@/types/reports/z-report";

interface Props {
  data: ZReportDayRow[];
  /** Fiscal columns are dropped entirely when the location has no VFD device. */
  showVfd: boolean;
}

/**
 * Day rows for the combined Z-report. Client-mode: the range action already
 * loads every day of the period in one shot, and a month of days never needs
 * server paging.
 */
export function ZReportTable({ data, showVfd }: Props) {
  const columns = useMemo(() => buildZReportColumns({ showVfd }), [showVfd]);

  return (
    <Card>
      <CardContent className="px-2 pt-6 sm:px-6">
        <DataTable columns={columns} data={data} searchKey="date" clientMode />
      </CardContent>
    </Card>
  );
}
