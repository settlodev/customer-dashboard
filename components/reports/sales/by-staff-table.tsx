"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { buildSalesByStaffColumns } from "@/components/tables/reports/sales-by-staff/columns";
import type { StaffReportItem } from "@/types/staff";

interface Props {
  data: StaffReportItem[];
  pageCount: number;
  pageNo: number;
  total: number;
  currency: string;
}

/**
 * Client wrapper around the data-table for the sales-by-staff summary.
 * Each row drills into that staff member's detail screen, landing on the
 * Sales tab (`?tab=sales`).
 */
export function SalesByStaffTable({
  data,
  pageCount,
  pageNo,
  total,
  currency,
}: Props) {
  const router = useRouter();
  const columns = useMemo(
    () => buildSalesByStaffColumns({ currency }),
    [currency],
  );

  return (
    <Card>
      <CardContent className="px-2 pt-6 sm:px-6">
        <DataTable
          columns={columns}
          data={data}
          pageCount={pageCount}
          pageNo={pageNo}
          searchKey="name"
          total={total}
          onRowClick={(item) => {
            // Rows whose seller couldn't be resolved to a staff record (blank
            // name — the order was attributed to a non-staff actor id) have no
            // staff detail page to open; don't drill into a dead route.
            if (item.id && item.name.trim())
              router.push(`/staff/${item.id}?tab=sales`);
          }}
        />
      </CardContent>
    </Card>
  );
}
