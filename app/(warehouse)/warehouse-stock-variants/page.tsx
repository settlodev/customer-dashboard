import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {DataTable} from "@/components/tables/data-table";
import {columns} from '@/components/tables/warehouse/stock-variants/column'
import { StockVariant } from "@/types/stockVariant/type";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { searchStockVariantsInWarehouse } from "@/lib/actions/warehouse/stock-variant-actions";

const breadCrumbItems = [{title: "Stock Items", link: "/stock-variants"}];
type Params = { 
    searchParams: Promise<{ 
        search?: string; 
        page?: string; 
        limit?: string; 
    }> 
};
 async function StockVariantPage({searchParams}:Params) {

    const resolvedSearchParams = await searchParams;
    
    const q = resolvedSearchParams.search || "";
    const page = Number(resolvedSearchParams.page) || 0;
    const pageLimit = Number(resolvedSearchParams.limit);

     const responseData = await searchStockVariantsInWarehouse(q,page,pageLimit);

    //  console.log("The stock present is: ", responseData );

     const data:StockVariant[]=responseData.content;
     const total =responseData.totalElements;
     const pageCount = responseData.totalPages

    return (
        <div className="flex-1 space-y-4 md:p-8 pt-6 mt-12">
            <div className="flex items-center justify-between mb-2 p-2">
                <div className="relative flex-1 md:max-w-md">
                    <BreadcrumbsNav items={breadCrumbItems} />
                </div>
                <div className={`flex items-center space-x-2`}>
                    <Button>
                        <Link href={`/warehouse-stocks/new`}>Add Stock</Link>
                    </Button>
                    <div>
                    {/* {total === 0 ?  <CSVStockDialog /> : null}
                    {total === 0 ?  <ProductWithStockCSVDialog /> : null} */}
                    </div>
                </div>
            </div>
            {
                total > 0 || q != "" ? (
                    <Card x-chunk="data-table">
                        <CardHeader>
                            <CardTitle>Stock Items</CardTitle>
                            <CardDescription>A list of all stock items in your warehouse</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable 
                               columns={columns}
                               data={data}
                               searchKey="stockAndStockVariantName"
                               pageNo={page}
                               total={total}
                               pageCount={pageCount}
                            
                            />
                        </CardContent>
                    </Card>
                ):
                (
                    <div className="h-[calc(100vh-240px)] border border-dashed">
                        <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
                            <h1 className="text-[1.5rem] font-bold leading-tight">No stock variant data found</h1>
                            <p className="text-sm text-center text-muted-foreground">There are no stock variant records found at the moment.</p>
                        </div>
                    </div>
                )
            }
        </div>
    );
}

export default StockVariantPage
