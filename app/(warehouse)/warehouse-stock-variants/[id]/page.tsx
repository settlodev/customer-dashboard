import {
  getStockVariantMovement,
  getStockVariantSummary,
} from "@/lib/actions/stock-variant-actions";
import { UUID } from "crypto";
import React from "react";
import StockMovementDashboard from "@/components/widgets/stock-movement";

import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import StockSummary from "@/components/widgets/stock-variant-summary";

type Params = Promise<{ id: string }>;

type SearchParams = Promise<{
  stock?: string;
  variant?: string;
  page?: string;
  size?: string;
}>;

export default async function StockVariantDetails({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const stock = resolvedSearchParams.stock;
  const page = parseInt(resolvedSearchParams.page || "1");
  const size = parseInt(resolvedSearchParams.size || "50");

  try {
    const [movementData, summaryData] = await Promise.all([
      getStockVariantMovement(resolvedParams.id as UUID, page, size),
      getStockVariantSummary(resolvedParams.id as UUID, stock as UUID),
    ]);

    const breadCrumbItems = [
      { title: "Stock Items", link: "/warehouse-stock-variants" },
      {
        title: `${movementData.content[0]?.stockName}-${movementData.content[0]?.stockVariantName}`, // ✅ Access via .content
        link: "",
      },
    ];
    return (
      <div className="p-4 space-y-4 mt-6">
        <BreadcrumbsNav items={breadCrumbItems} />
        <StockSummary summary={summaryData} />

        <StockMovementDashboard
          movements={movementData}
          currentPage={page}
          pageSize={size}
        />
      </div>
    );
  } catch (error) {
    return (
      <div className="p-4">
        <div className="text-red-500">
          Error loading data:{" "}
          {error instanceof Error ? error.message : "Unknown error occurred"}
        </div>
      </div>
    );
  }
}
