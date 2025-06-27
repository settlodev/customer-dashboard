"use client"
import {Button} from "@/components/ui/button";
import { useEffect, useState } from "react";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import NoItems from "@/components/layouts/no-items";
import {DataTable} from "@/components/tables/data-table";
import {columns} from '@/components/tables/stock-transfer/column'
import { searchStockTransfers } from "@/lib/actions/stock-transfer-actions";
import { StockTransfer } from "@/types/stock-transfer/type";
import { getCurrentBusiness } from "@/lib/actions/business/get-current-business";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const breadCrumbItems = [{title: "Stock Transfer", link: "/stock-transfers"}];

type Params = { 
    searchParams: Promise<{ 
        search?: string; 
        page?: string; 
        limit?: string; 
    }> 
};

function Page({searchParams}: Params) {
    const [totalLocations, setTotalLocations] = useState<number | undefined>(undefined);
    const [data, setData] = useState<StockTransfer[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [pageCount, setPageCount] = useState<number>(0);
    const [resolvedParams, setResolvedParams] = useState<{
        search?: string;
        page?: string;
        limit?: string;
    } | null>(null);
    
    const {toast} = useToast();
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
        const fetchBusinessData = async () => {
            const business = await getCurrentBusiness();
            setTotalLocations(business?.totalLocations);
        };

        fetchBusinessData();
    }, []);

    useEffect(() => {
        if (resolvedParams === null) return; 
        
        const fetchStockTransfers = async () => {
            const responseData = await searchStockTransfers(q, page, pageLimit);
            setData(responseData.content);
            setTotal(responseData.totalElements);
            setPageCount(responseData.totalPages);
        };

        fetchStockTransfers();
    }, [q, page, pageLimit, resolvedParams]); 

    const handleStockTransfer = async () => {
        if (totalLocations && totalLocations <= 1) {
            toast({
                title: "You can't transfer stock",
                description: "You can only transfer stock between two locations",
                variant: "destructive",
            });
        } else {
            await router.push(`/stock-transfers/new`);
        }
    };

    // Show loading state while params are being resolved
    if (resolvedParams === null) {
        return <div>Loading...</div>;
    }

    return (
        <div className={`flex-1 space-y-4 md:p-8 pt-6 mt-10`}>
            <div className={`flex items-center justify-between mb-2`}>
                <div className={`relative flex-1 md:max-w-md`}>
                    <BreadcrumbsNav items={breadCrumbItems} />
                </div>
                <div className={`flex items-center space-x-2`}>
                    <Button onClick={handleStockTransfer}>
                        Transfer Stock 
                    </Button>
                </div>
            </div>
            {
                total > 0 || q !== "" ? (
                    <Card x-chunk="data-table">
                        <CardHeader>
                            <CardTitle>Stock Transfers</CardTitle>
                            <CardDescription>Transfer stock from one location to another</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable columns={columns}
                                       data={data}
                                       searchKey="stockVariantName"
                                       pageNo={page}
                                       total={total}
                                       pageCount={pageCount}
                            />
                        </CardContent>
                    </Card>
                ) : (
                    <NoItems newItemUrl={`/stock-transfers/new`} itemName={`Stock Transfer`}/>
                )
            }
        </div>
    );
}

export default Page;