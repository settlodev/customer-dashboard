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
import { columns } from "@/components/tables/stock-intake-receivable/column";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { searchStockIntakeReceived } from "@/lib/actions/stock-purchase-actions";
import { StockPurchase } from "@/types/stock-purchases/type";
import { Loader2 } from "lucide-react";
import { StockReceipt } from "@/types/stock-intake-receipt/type";

const breadCrumbItems = [
  { title: "Goods Received", link: "/receivable-goods" },
];

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
  }>;
};

function Page({ searchParams }: Params) {
  const [goodsReceived, setGoodsReceived] = useState<StockReceipt[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [pageCount, setPageCount] = useState<number>(0);
  const [resolvedParams, setResolvedParams] = useState<{
    search?: string;
    page?: string;
    limit?: string;
  } | null>(null);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

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

    const fetchGoodsReceived = async () => {
      if (initialLoading) {
        setInitialLoading(true);
      }

      try {
        const responseData = await searchStockIntakeReceived(
          q,
          page,
          pageLimit,
        );

        const receivedOrders = responseData.content;
        setGoodsReceived(receivedOrders);
        setTotal(responseData.totalElements);
        setPageCount(responseData.totalPages);
      } catch (error) {
        console.error("Error fetching goods received:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load goods received. Please try again.",
        });
      } finally {
        setInitialLoading(false);
      }
    };

    fetchGoodsReceived();
  }, [q, page, pageLimit, resolvedParams]);

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
            <CardTitle>Goods Received</CardTitle>
            <CardDescription>
              Track goods received from your suppliers
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading goods received...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`flex-1 space-y-4 md:p-8 pt-6 mt-10`}>
      <div className={`flex items-center justify-between mb-2`}>
        <div className={`relative flex-1 md:max-w-md`}>
          <BreadcrumbsNav items={breadCrumbItems} />
        </div>
      </div>
      {total > 0 || q !== "" ? (
        <Card x-chunk="data-table">
          <CardHeader>
            <CardTitle>Goods Received</CardTitle>
            <CardDescription>
              Track stock received from your suppliers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={goodsReceived}
              searchKey=""
              pageNo={page}
              total={total}
              pageCount={pageCount}
            />
          </CardContent>
        </Card>
      ) : (
        <NoItems
          itemName="Goods Received"
          newItemUrl={`/stock-purchases/new`}
        />
      )}
    </div>
  );
}

export default Page;
