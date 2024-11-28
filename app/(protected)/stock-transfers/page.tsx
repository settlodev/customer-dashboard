import {Button} from "@/components/ui/button";
import Link from "next/link";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import NoItems from "@/components/layouts/no-items";
import {DataTable} from "@/components/tables/data-table";
import {columns} from '@/components/tables/stock-transfer/column'
import { searchStockTransfers } from "@/lib/actions/stock-transfer-actions";
import { StockTransfer } from "@/types/stock-transfer/type";

const breadCrumbItems = [{title: "Stock Transfer", link: "/stock-transfers"}];
 type ParamsProps ={
     searchParams:{
         [key:string]:string | undefined
     }
 };
 async function Page({searchParams}:ParamsProps) {

     const q = searchParams.search || "";
     const page = Number(searchParams.page) || 0;
     const pageLimit = Number(searchParams.limit);

     const responseData = await searchStockTransfers(q,page,pageLimit);

     const data:StockTransfer[]=responseData.content;
     const total =responseData.totalElements;
     const pageCount = responseData.totalPages

    return (
        <div className={`flex-1 space-y-4 md:p-8 pt-6`}>
            <div className={`flex items-center justify-between mb-2`}>
                <div className={`relative flex-1 md:max-w-md`}>
                    <BreadcrumbsNav items={breadCrumbItems} />
                </div>
                <div className={`flex items-center space-x-2`}>
                    <Button>
                        <Link href={`/stock-transfers/new`}>Transfer Stock </Link>
                    </Button>
                </div>
            </div>
            {
                total > 0 || q != "" ? (
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
                ):
                    (
                        <NoItems newItemUrl={`/stock-transfers/new`} itemName={`Stock Transfer`} stockTransfer="To perform stock transfer make sure you have at least two business locations"/>
                    )
            }
        </div>
    );
}

export default Page
