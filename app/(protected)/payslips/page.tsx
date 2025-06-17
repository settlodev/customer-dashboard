

import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {DataTable} from "@/components/tables/data-table";
import {columns} from '@/components/tables/payslip/column'
import { searchPayslip } from "@/lib/actions/payslip-actions";
import { Payslip } from "@/types/payslip/type";


const breadCrumbItems = [{title:"Payslips",link:"/payslips"}];
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

     const responseData = await searchPayslip(q,page,pageLimit);

     const data:Payslip[]=responseData.content;
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
                            <CardTitle>Payslips</CardTitle>
                            <CardDescription>Manage payslips for your staff in your business location</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable columns={columns}
                                       data={data}
                                       searchKey="staff"
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
                                <h1 className="text-[1.5rem] font-bold leading-tight">No payslips data found</h1>
                                <p className="text-sm text-center text-muted-foreground">There are no payslips records found at the moment, add new payslips to start viewing data.</p>
                            </div>
                        </div>
                    )
            }
        </div>
    );
}

export default Page
