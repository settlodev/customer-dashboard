"use client";

import { useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { voidEventColumns } from "@/components/tables/reports/voids/columns";
import type { VoidEvent } from "@/lib/orders/void-events";

interface Props {
  data: VoidEvent[];
  pageCount: number;
  pageNo: number;
  total: number;
}

/**
 * Client wrapper for the voids/cancellations DataTable. Owns row-click
 * navigation — every row (item void or cancellation) links to its parent
 * order's detail screen, where the items/timeline already surface the void.
 */
export function VoidEventsTable({ data, pageCount, pageNo, total }: Props) {
  const router = useRouter();

  return (
    <Card>
      <CardContent className="px-2 pt-6 sm:px-6">
        <DataTable
          columns={voidEventColumns}
          data={data}
          pageCount={pageCount}
          pageNo={pageNo}
          searchKey="orderNumber"
          searchPlaceholder="Search item, order #, staff…"
          total={total}
          onRowClick={(event) => router.push(`/orders/${event.orderId}`)}
        />
      </CardContent>
    </Card>
  );
}
