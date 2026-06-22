

import {Button} from "@/components/ui/button";
import Link from "next/link";
import {
    PageShell,
    PageHeader,
    PageBreadcrumbs,
    PageBody,
} from "@/components/layouts/page-shell";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import NoItems from "@/components/layouts/no-items";
import DataLoadError from "@/components/layouts/data-load-error";
import {DataTable} from "@/components/tables/data-table";
import { searchStockRequests } from "@/lib/actions/request-actions";
import { StockRequests } from "@/types/stock-request/type";
import { columns } from "@/components/tables/stock-request/columns";
import { softFetch } from "@/lib/list-fallback";


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

     const responseData = await softFetch(searchStockRequests(q,page,pageLimit));

     const data:StockRequests[]=responseData?.content ?? [];
     const total =responseData?.totalElements ?? 0;
     const pageCount = responseData?.totalPages ?? 0

    return (
        <PageShell>
            <PageBreadcrumbs items={[{ title: "Stock Requests" }]} />
            <PageHeader
                title="Stock Requests"
                subtitle="Manage stock requests"
                actions={
                    <>
                        <Button>
                            <Link href={`/stock-requests/new`}>
                                Request Stock
                            </Link>
                        </Button>
                    </>
                }
            />
            <PageBody>
            {
                !responseData ? (
                    <DataLoadError itemName="stock requests" />
                ) : total > 0 || q != "" ? (
                    <Card x-chunk="data-table">
                        <CardHeader>
                            <CardTitle>Stock Requests</CardTitle>
                            <CardDescription>Manage stock requests</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable columns={columns}
                                       data={data}
                                       searchKey="warehouseStockVariantName"
                                       pageNo={page}
                                       total={total}
                                       pageCount={pageCount}
                                       filterKey="requestStatus"
                                        filterOptions={[
                                            { label: "All", value: "" },
                                            { label: "Approved", value: "APPROVED" },
                                            { label: "Pending", value: "PENDING" },
                                            { label: "Cancelled", value: "CANCELLED" },
                                        ]}
                            />
                        </CardContent>
                    </Card>
                ):
                    (
                        <NoItems newItemUrl={`/stock-requests/new`} itemName={`Stock Request`}/>
                    )
            }
            </PageBody>
        </PageShell>
    );
}

export default Page
