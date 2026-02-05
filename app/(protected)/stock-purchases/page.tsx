// "use client";
//
// import { Button } from "@/components/ui/button";
// import { useEffect, useState } from "react";
// import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import NoItems from "@/components/layouts/no-items";
// import { DataTable } from "@/components/tables/data-table";
// import { columns } from "@/components/tables/stock-purchases/column";
// import { useToast } from "@/hooks/use-toast";
// import { useRouter } from "next/navigation";
// import { searchStockPurchases } from "@/lib/actions/stock-purchase-actions";
// import { StockPurchase } from "@/types/stock-purchases/type";
// import { Loader2 } from "lucide-react";
//
// const breadCrumbItems = [
//   { title: "Stock Purchases", link: "/stock-purchases" },
// ];
//
// type Params = {
//   searchParams: Promise<{
//     search?: string;
//     page?: string;
//     limit?: string;
//   }>;
// };
//
// function Page({ searchParams }: Params) {
//   const [data, setData] = useState<StockPurchase[]>([]);
//   const [total, setTotal] = useState<number>(0);
//   const [pageCount, setPageCount] = useState<number>(0);
//   const [resolvedParams, setResolvedParams] = useState<{
//     search?: string;
//     page?: string;
//     limit?: string;
//   } | null>(null);
//   const [initialLoading, setInitialLoading] = useState<boolean>(true);
//
//   const { toast } = useToast();
//   const router = useRouter();
//
//   // Resolve search params
//   useEffect(() => {
//     const resolveParams = async () => {
//       const params = await searchParams;
//       setResolvedParams(params);
//     };
//     resolveParams();
//   }, [searchParams]);
//
//   // Extract values from resolved params
//   const q = resolvedParams?.search || "";
//   const page = Number(resolvedParams?.page) || 0;
//   const pageLimit = Number(resolvedParams?.limit);
//
//   useEffect(() => {
//     if (resolvedParams === null) return;
//
//     const fetchStockPurchases = async () => {
//       if (initialLoading) {
//         setInitialLoading(true);
//       }
//
//       try {
//         const responseData = await searchStockPurchases(q, page, pageLimit);
//         setData(responseData.content);
//         setTotal(responseData.totalElements);
//         setPageCount(responseData.totalPages);
//       } catch (error) {
//         console.error("Error fetching stock purchases:", error);
//         toast({
//           variant: "destructive",
//           title: "Error",
//           description: "Failed to load stock purchases. Please try again.",
//         });
//       } finally {
//         setInitialLoading(false);
//       }
//     };
//
//     fetchStockPurchases();
//   }, [q, page, pageLimit, resolvedParams]);
//
//   const handleStockPurchase = async () => {
//     await router.push(`/stock-purchases/new`);
//   };
//
//   // Show loading state while params are being resolved OR during initial load
//   if (resolvedParams === null || initialLoading) {
//     return (
//       <div className={`flex-1 space-y-4 md:p-8 pt-6 mt-10`}>
//         <div className={`flex items-center justify-between mb-2`}>
//           <div className={`relative flex-1 md:max-w-md`}>
//             <div className="h-6 w-48 bg-gray-200 animate-pulse rounded"></div>
//           </div>
//           <div className={`flex items-center space-x-2`}>
//             <div className="h-10 w-36 bg-gray-200 animate-pulse rounded"></div>
//           </div>
//         </div>
//
//         <Card x-chunk="data-table">
//           <CardHeader>
//             <CardTitle>Stock Purchases</CardTitle>
//             <CardDescription>
//               Purchase stock from your trusted suppliers
//             </CardDescription>
//           </CardHeader>
//           <CardContent className="flex items-center justify-center py-12">
//             <div className="flex flex-col items-center gap-4">
//               <Loader2 className="h-8 w-8 animate-spin text-primary" />
//               <p className="text-muted-foreground">
//                 Loading stock purchases...
//               </p>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }
//
//   return (
//     <div className={`flex-1 space-y-4 md:p-8 pt-6 mt-10`}>
//       <div className={`flex items-center justify-between mb-2`}>
//         <div className={`relative flex-1 md:max-w-md`}>
//           <BreadcrumbsNav items={breadCrumbItems} />
//         </div>
//         <div className={`flex items-center space-x-2`}>
//           <Button onClick={handleStockPurchase}>Stock Purchase</Button>
//         </div>
//       </div>
//       {total > 0 || q !== "" ? (
//         <Card x-chunk="data-table">
//           <CardHeader>
//             <CardTitle>Stock Purchases</CardTitle>
//             <CardDescription>
//               Purchase stock from your trusted suppliers
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <DataTable
//               columns={columns}
//               data={data}
//               searchKey=""
//               pageNo={page}
//               total={total}
//               pageCount={pageCount}
//             />
//           </CardContent>
//         </Card>
//       ) : (
//         <NoItems
//           newItemUrl={`/stock-purchases/new`}
//           itemName={`Stock Purchase`}
//         />
//       )}
//     </div>
//   );
// }
//
// export default Page;

"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import NoItems from "@/components/layouts/no-items";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/stock-purchases/column";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { searchStockPurchases } from "@/lib/actions/stock-purchase-actions";
import { StockPurchase } from "@/types/stock-purchases/type";
import { Loader2 } from "lucide-react";
import { StockPurchaseModal } from "@/components/local-purchase-order/form-modal";

const breadCrumbItems = [
  { title: "Stock Purchases", link: "/stock-purchases" },
];

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
  }>;
};

function Page({ searchParams }: Params) {
  const [data, setData] = useState<StockPurchase[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [pageCount, setPageCount] = useState<number>(0);
  const [resolvedParams, setResolvedParams] = useState<{
    search?: string;
    page?: string;
    limit?: string;
  } | null>(null);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false); // Add modal state

  const { toast } = useToast();
  const router = useRouter();

  // Resolve search params
  useEffect(() => {
    const resolveParams = async () => {
      const params = await searchParams;
      setResolvedParams(params);
    };
    resolveParams();
  }, [searchParams]);

  // Extract values from resolved params
  const q = resolvedParams?.search || "";
  const page = Number(resolvedParams?.page) || 0;
  const pageLimit = Number(resolvedParams?.limit);

  useEffect(() => {
    if (resolvedParams === null) return;

    const fetchStockPurchases = async () => {
      if (initialLoading) {
        setInitialLoading(true);
      }

      try {
        const responseData = await searchStockPurchases(q, page, pageLimit);
        setData(responseData.content);
        setTotal(responseData.totalElements);
        setPageCount(responseData.totalPages);
      } catch (error) {
        console.error("Error fetching stock purchases:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load stock purchases. Please try again.",
        });
      } finally {
        setInitialLoading(false);
      }
    };

    fetchStockPurchases();
  }, [q, page, pageLimit, resolvedParams]);

  // Function to handle successful form submission
  const handleSuccess = () => {
    setModalOpen(false);
    // Refresh the data
    fetchStockPurchases();
  };

  const fetchStockPurchases = async () => {
    try {
      const responseData = await searchStockPurchases(q, page, pageLimit);
      setData(responseData.content);
      setTotal(responseData.totalElements);
      setPageCount(responseData.totalPages);
    } catch (error) {
      console.error("Error fetching stock purchases:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load stock purchases. Please try again.",
      });
    }
  };

  // Show loading state while params are being resolved OR during initial load
  if (resolvedParams === null || initialLoading) {
    return (
      <div className={`flex-1 space-y-4 md:p-8 pt-6 mt-10`}>
        <div className={`flex items-center justify-between mb-2`}>
          <div className={`relative flex-1 md:max-w-md`}>
            <div className="h-6 w-48 bg-gray-200 animate-pulse rounded"></div>
          </div>
          <div className={`flex items-center space-x-2`}>
            <div className="h-10 w-36 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>

        <Card x-chunk="data-table">
          <CardHeader>
            <CardTitle>Stock Purchases</CardTitle>
            <CardDescription>
              Purchase stock from your trusted suppliers
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">
                Loading stock purchases...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className={`flex-1 space-y-4 md:p-8 pt-6 mt-10`}>
        <div className={`flex items-center justify-between mb-2`}>
          <div className={`relative flex-1 md:max-w-md`}>
            <BreadcrumbsNav items={breadCrumbItems} />
          </div>
          <div className={`flex items-center space-x-2`}>
            <Button onClick={() => setModalOpen(true)}>Stock Purchase</Button>
          </div>
        </div>
        {total > 0 || q !== "" ? (
          <Card x-chunk="data-table">
            <CardHeader>
              <CardTitle>Stock Purchases</CardTitle>
              <CardDescription>
                Purchase stock from your trusted suppliers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={data}
                searchKey=""
                pageNo={page}
                total={total}
                pageCount={pageCount}
              />
            </CardContent>
          </Card>
        ) : (
          <NoItems
            itemName="Stock Purchase"
            onCreateNew={() => setModalOpen(true)}
          />
        )}
      </div>

      {/* Modal for creating/editing stock purchase */}
      <StockPurchaseModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}

export default Page;
