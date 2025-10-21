// import {
//   getStockVariantMovement,
//   getStockVariantSummary,
// } from "@/lib/actions/stock-variant-actions";
// import { UUID } from "crypto";
// import React, { Suspense } from "react";
// import StockMovementDashboard from "@/components/widgets/stock-movement";
//
// import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
// import StockSummary from "@/components/widgets/stock-variant-summary";
//
// type Params = Promise<{ id: string }>;
// type SearchParams = Promise<{
//   stock?: string;
//   variant?: string;
//   page?: string;
//   size?: string;
// }>;
//
// export default async function StockVariantDetails({
//   params,
//   searchParams,
// }: {
//   params: Params;
//   searchParams: SearchParams;
// }) {
//   const resolvedParams = await params;
//   const resolvedSearchParams = await searchParams;
//   const stock = resolvedSearchParams.stock;
//   const page = parseInt(resolvedSearchParams.page || "1");
//   const size = parseInt(resolvedSearchParams.size || "10");
//
//   try {
//     const [movementData, summaryData] = await Promise.all([
//       getStockVariantMovement(resolvedParams.id as UUID, page, size),
//       getStockVariantSummary(resolvedParams.id as UUID, stock as UUID),
//     ]);
//
//     const breadCrumbItems = [
//       { title: "Stock Items", link: "/stock-variants" },
//       {
//         title: `${movementData[0]?.stockName}-${movementData[0]?.stockVariantName}`,
//         link: "",
//       },
//     ];
//
//     return (
//       <div className="p-4 space-y-4 mt-6">
//         <BreadcrumbsNav items={breadCrumbItems} />
//         <Suspense fallback={<div>Loading...</div>}>
//           <StockSummary summary={summaryData} />
//           <StockMovementDashboard
//             movements={movementData}
//             currentPage={page}
//             pageSize={size}
//           />
//         </Suspense>
//       </div>
//     );
//   } catch (error) {
//     return (
//       <div className="p-4">
//         <div className="text-red-500">
//           Error loading data:{" "}
//           {error instanceof Error ? error.message : "Unknown error occurred"}
//         </div>
//       </div>
//     );
//   }
// }

import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Suspense } from "react";
import {
  getStockVariantMovement,
  getStockVariantSummary,
} from "@/lib/actions/stock-variant-actions";
import { UUID } from "crypto";
import StockMovementDashboard from "@/components/widgets/stock-movement";
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
      getStockVariantMovement(resolvedParams.id as UUID, page, size), // Returns ApiResponse<StockMovement>
      getStockVariantSummary(resolvedParams.id as UUID, stock as UUID),
    ]);

    const breadCrumbItems = [
      { title: "Stock Items", link: "/stock-variants" },
      {
        title: `${movementData.content[0]?.stockName}-${movementData.content[0]?.stockVariantName}`, // ✅ Access via .content
        link: "",
      },
    ];

    return (
      <div className="p-4 space-y-4 mt-6">
        <BreadcrumbsNav items={breadCrumbItems} />
        <Suspense fallback={<div>Loading...</div>}>
          {/*<Card>*/}
          {/*  <CardContent className="pt-6">*/}
          {/*    <div className="space-y-2">*/}
          {/*      <div className="space-y-2">*/}
          {/*        <h3 className="font-bold text-lg">Stock Movements History</h3>*/}
          {/*        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">*/}
          {/*          <div className="flex items-center gap-2">*/}
          {/*            <h2 className="text-[32px] font-bold capitalize">*/}
          {/*              {movementData.content[0]?.stockName} /!* ✅ Access via .content *!/*/}
          {/*              <span className="text-black">-</span>*/}
          {/*              {movementData.content[0]?.stockVariantName}*/}
          {/*            </h2>*/}
          {/*          </div>*/}
          {/*        </div>*/}
          {/*      </div>*/}
          {/*    </div>*/}
          {/*  </CardContent>*/}
          {/*</Card>*/}

          <StockSummary summary={summaryData} />

          <StockMovementDashboard
            movements={movementData} // ✅ Pass the full ApiResponse
            currentPage={page}
            pageSize={size}
          />
        </Suspense>
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
