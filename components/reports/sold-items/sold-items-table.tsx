"use client";

import { useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataTable } from "@/components/tables/data-table";
import { soldItemsColumns } from "@/components/tables/reports/sold-items/columns";
import type { SoldItemLine } from "@/types/reports/sold-items";

interface Props {
  data: SoldItemLine[];
  pageCount: number;
  pageNo: number;
  total: number;
}

/**
 * Client wrapper for the sold-items DataTable.
 *
 * Lives on the client because individual cells render Radix tooltips
 * (for the modifications column) — Next.js forbids passing those
 * directly from a server component. The wrapper also owns row-click
 * navigation; rows link to `/products/{productId}` so a manager can
 * jump straight to the catalogue from any line.
 */
export function SoldItemsTable({ data, pageCount, pageNo, total }: Props) {
  const router = useRouter();

  return (
    <TooltipProvider delayDuration={150}>
      <Card>
        <CardContent className="px-2 pt-6 sm:px-6">
          <DataTable
            columns={soldItemsColumns}
            data={data}
            pageCount={pageCount}
            pageNo={pageNo}
            searchKey="productName"
            total={total}
            onRowClick={(item) => {
              if (item.productId) {
                router.push(`/products/${item.productId}`);
              }
            }}
          />
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
