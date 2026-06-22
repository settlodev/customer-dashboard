

import { PageShell, PageHeader, PageBreadcrumbs, PageBody } from "@/components/layouts/page-shell";
import DataLoadError from "@/components/layouts/data-load-error";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {DataTable} from "@/components/tables/data-table";
import {columns} from '@/components/tables/payslip/column'
import { searchPayslip } from "@/lib/actions/payslip-actions";
import { softFetch } from "@/lib/list-fallback";
import { Payslip } from "@/types/payslip/type";


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

     const responseData = await softFetch(searchPayslip(q,page,pageLimit));

     const data:Payslip[]=responseData?.content ?? [];
     const total =responseData?.totalElements ?? 0;
     const pageCount = responseData?.totalPages ?? 0

    return (
        <PageShell>
            <PageBreadcrumbs items={[{ title: "Payslips" }]} />
            <PageHeader
                title="Payslips"
                subtitle="Manage payslips for your staff in your business location"
            />
            <PageBody>
                {
                    !responseData ? (
                        <DataLoadError itemName="payslips" />
                    ) : total > 0 || q != "" ? (
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
            </PageBody>
        </PageShell>
    );
}

export default Page
