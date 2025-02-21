import {Button} from "@/components/ui/button";
import Link from "next/link";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import NoItems from "@/components/layouts/no-items";
import {DataTable} from "@/components/tables/data-table";
import {columns} from '@/components/tables/stock/column'
import { searchStock } from "@/lib/actions/stock-actions";
import { Stock } from "@/types/stock/type";
import { CSVStockDialog } from "@/components/csv/stockCsvImport";
import { ProductWithStockCSVDialog } from "@/components/csv/ProductWithStockCsvImport";

const breadCrumbItems = [{title: "Stock", link: "/stocks"}];
 type ParamsProps ={
     searchParams:{
         [key:string]:string | undefined
     }
 };
 async function StockPage({searchParams}:ParamsProps) {

     const q = searchParams.search || "";
     const page = Number(searchParams.page) || 0;
     const pageLimit = Number(searchParams.limit);

     const responseData = await searchStock(q,page,pageLimit);

    //  console.log("The stock present is: ", responseData );

     const data:Stock[]=responseData.content;
     const total =responseData.totalElements;
     const pageCount = responseData.totalPages

    return (
        <div className={`flex-1 space-y-4 md:p-8 pt-6 mt-10`}>
            <div className={`flex items-center justify-between mb-2`}>
                <div className={`relative flex-1 md:max-w-md`}>
                    <BreadcrumbsNav items={breadCrumbItems} />
                </div>
                <div className={`flex items-center space-x-2`}>
                    <Button>
                        <Link href={`/stocks/new`}>Add Stock</Link>
                    </Button>
                    <div>
                    {total === 0 ?  <CSVStockDialog /> : null}
                    {total === 0 ?  <ProductWithStockCSVDialog /> : null}
                    </div>
                </div>
            </div>
            {
                total > 0 || q != "" ? (
                    <Card x-chunk="data-table">
                        <CardHeader>
                            <CardTitle>Stock</CardTitle>
                            <CardDescription>Manage Stock in your business location</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable columns={columns}
                               data={data}
                               searchKey="name"
                               pageNo={page}
                               total={total}
                               pageCount={pageCount}
                            />
                        </CardContent>
                    </Card>
                ):
                    (
                        <NoItems newItemUrl={`/stocks/new`} itemName={`Stock`}/>
                    )
            }
        </div>
    );
}

export default StockPage
