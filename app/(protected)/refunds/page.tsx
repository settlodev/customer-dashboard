

import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {DataTable} from "@/components/tables/data-table";
import {columns} from '@/components/tables/refunds/column'
import { searchOrderItemRefunds } from "@/lib/actions/refund-actions";
import { OrderItemRefunds } from "@/types/refunds/type";


const breadCrumbItems = [{title:"Item refunded",link:"/refunds"}];
 type ParamsProps ={
     searchParams:{
         [key:string]:string | undefined
     }
 };
 async function Page({searchParams}:ParamsProps) {

     const q = searchParams.search || "";
     const page = Number(searchParams.page) || 0;
     const pageLimit = Number(searchParams.limit);

     const responseData = await searchOrderItemRefunds(q,page,pageLimit);

     const data:OrderItemRefunds[]=responseData.content;
     const total =responseData.totalElements;
     const pageCount = responseData.totalPages

    return (
        <div className={`flex-1 space-y-4 md:p-8 pt-6`}>
            <div className={`flex items-center justify-between mb-2`}>
                <div className={`relative flex-1 md:max-w-md`}>
                    <BreadcrumbsNav items={breadCrumbItems} />
                </div>
              
            </div>
            {
                total > 0 || q != "" ? (
                    <Card x-chunk="data-table">
                        <CardHeader>
                            <CardTitle>Items Refunded</CardTitle>
                            <CardDescription>A list of all orders</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable columns={columns}
                                       data={data}
                                       searchKey="orderItemName"
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
                                <h1 className="text-[1.5rem] font-bold leading-tight">No item refunded found</h1>
                                <p className="text-sm text-center text-muted-foreground">There are no order records found  on item at the moment.</p>
                            </div>
                        </div>
                    )
            }
        </div>
    );
}

export default Page
