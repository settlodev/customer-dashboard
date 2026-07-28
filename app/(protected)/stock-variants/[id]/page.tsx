import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Suspense } from "react";
import {
  getStockVariantById,
  getStockVariantMovement,
  getStockVariantSummary,
} from "@/lib/actions/stock-variant-actions";
import { UUID } from "crypto";
import StockMovementDashboard from "@/components/widgets/stock-movement";
import StockSummary from "@/components/widgets/stock-variant-summary";
import Loading from "@/components/ui/loading";

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
  let stockId = resolvedSearchParams.stock;
  const page = parseInt(resolvedSearchParams.page || "1");
  const size = parseInt(resolvedSearchParams.size || "50");

  try {
    // If stock query param is missing, fetch the variant to get it
    if (!stockId) {
      const variant = await getStockVariantById(resolvedParams.id as UUID);
      if (!variant) {
        throw new Error("Stock variant not found");
      }
      stockId = variant.stock;
    }

    const [movementData, summaryData] = await Promise.all([
      getStockVariantMovement(resolvedParams.id as UUID, page, size),
      getStockVariantSummary(resolvedParams.id as UUID, stockId as UUID),
    ]);

    const variantName = movementData.content[0]
      ? `${movementData.content[0].stockName} - ${movementData.content[0].stockVariantName}`
      : "Stock Variant";

    const breadcrumbItems = [
      { title: "Stock Items", link: "/stock-variants" },
      { title: variantName, link: "" },
    ];

    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <BreadcrumbsNav items={breadcrumbItems} />
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-48">
              <Loading />
            </div>
          }
        >
          <StockSummary summary={summaryData} />
          <StockMovementDashboard
            movements={movementData}
            currentPage={page}
            pageSize={size}
          />
        </Suspense>
      </div>
    );
  } catch (error) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <BreadcrumbsNav
          items={[
            { title: "Stock Items", link: "/stock-variants" },
            { title: "Error", link: "" },
          ]}
        />
        <div className="text-sm text-red-500">
          Error loading data:{" "}
          {error instanceof Error ? error.message : "Unknown error occurred"}
        </div>
      </div>
    );
  }
}
