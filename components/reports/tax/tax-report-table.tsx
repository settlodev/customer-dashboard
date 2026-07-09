"use client";

import { useMemo } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { buildTaxReportColumns } from "@/components/tables/reports/tax/columns";
import type { TaxReportBreakdown, TaxReportRow } from "@/types/reports/tax";

interface Props {
  data: TaxReportRow[];
  breakdown: TaxReportBreakdown;
  multiCurrency: boolean;
}

/** Client wrapper around the data-table for the tax report rows. */
export function TaxReportTable({ data, breakdown, multiCurrency }: Props) {
  const columns = useMemo(
    () => buildTaxReportColumns({ breakdown, multiCurrency }),
    [breakdown, multiCurrency],
  );

  return (
    <Card>
      <CardContent className="px-2 pt-6 sm:px-6">
        <DataTable columns={columns} data={data} searchKey="productName" clientMode />
      </CardContent>
    </Card>
  );
}
