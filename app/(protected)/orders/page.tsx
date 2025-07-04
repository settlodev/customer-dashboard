import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {DataTable} from "@/components/tables/data-table";
import {columns} from '@/components/tables/orders/column'
import { searchOrder } from "@/lib/actions/order-actions";
import OrdersSummary from "@/components/widgets/order/orders-list-summary";

const breadCrumbItems = [{title:"Orders",link:"/orders"}];
type Params = { 
    searchParams: Promise<{ 
        search?: string; 
        page?: string; 
        limit?: string; 
    }> 
};

 async function Page({searchParams}:Params) {
    const resolvedSearchParams = await searchParams;
    
    const q = resolvedSearchParams.search || "";
    const page = Number(resolvedSearchParams.page) || 0;
    const pageLimit = Number(resolvedSearchParams.limit);


     const responseData = await searchOrder(q, page, pageLimit);
     const total = responseData.totalElements;
     const pageCount = responseData.totalPages;

     return (
         <div className="flex-1 space-y-4 md:p-8 pt-6">
             <div className="flex items-center justify-between mb-2">
                 <div className="relative flex-1 md:max-w-md">
                     <BreadcrumbsNav items={breadCrumbItems} />
                 </div>
             </div>

             <OrdersSummary data={responseData} />

             {total > 0 || q !== "" ? (
                 <Card>
                     <CardHeader>
                         <CardTitle>Orders</CardTitle>
                         <CardDescription>A list of all orders with detailed information</CardDescription>
                     </CardHeader>
                     <CardContent>
                         <DataTable
                             columns={columns}
                             data={responseData.content}
                             searchKey="orderNumber"
                             pageNo={page}
                             total={total}
                             pageCount={pageCount}
                             filterKey="orderStatus"
                             filterOptions={[
                                 { label: "All", value: "" },
                                 { label: "Closed", value: "CLOSED" },
                                 { label: "Open", value: "OPEN" },
                             ]}
                         />
                     </CardContent>
                 </Card>
             ) : (
                 <div className="h-[calc(100vh-240px)] border border-dashed">
                     <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
                         <h1 className="text-[1.5rem] font-bold leading-tight">No order data found</h1>
                         <p className="text-sm text-center text-muted-foreground">
                             There are no order records found at the moment.
                         </p>
                     </div>
                 </div>
             )}
         </div>
     );
}

export default Page
