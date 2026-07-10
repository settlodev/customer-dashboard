"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { buildTopSellingColumns } from "@/components/tables/reports/top-selling/columns";
import type { TopSellingItem } from "@/types/reports/top-selling";

interface Props {
  data: TopSellingItem[];
  pageCount: number;
  pageNo: number;
  total: number;
  currency: string;
  /**
   * Optional query string appended to the product link on row click
   * (e.g. "?tab=sales" to land straight on the product's Sales tab when
   * this table is embedded in the sales report hub).
   */
  rowClickQuery?: string;
  /** Hide the "Avg price" column (e.g. on the sales report product tab). */
  hideAveragePrice?: boolean;
}

/**
 * Client wrapper around the data-table for the top-selling report.
 *
 * The columns array is built on the client because individual cells
 * render React components (icons, sparklines, image thumbs) — Next.js
 * forbids calling a client-side factory from a server component, so
 * the column factory has to live here, not on the page.
 */
export function TopSellingTable({
  data,
  pageCount,
  pageNo,
  total,
  currency,
  rowClickQuery = "",
  hideAveragePrice = false,
}: Props) {
  const router = useRouter();
  const columns = useMemo(
    () => buildTopSellingColumns({ currency, hideAveragePrice }),
    [currency, hideAveragePrice],
  );

  // DataTable's built-in `rowClickBasePath` assumes the row has an
  // `id` field — top-selling rows don't, they're keyed by productId
  // (a product appears multiple times if it has multiple variants).
  // Use the explicit onRowClick callback so we navigate by productId.
  return (
    <Card>
      <CardContent className="px-2 pt-6 sm:px-6">
        <DataTable
          columns={columns}
          data={data}
          pageCount={pageCount}
          pageNo={pageNo}
          searchKey="productName"
          total={total}
          onRowClick={(item) => {
            if (item.productId) {
              router.push(`/products/${item.productId}${rowClickQuery}`);
            }
          }}
        />
      </CardContent>
    </Card>
  );
}
