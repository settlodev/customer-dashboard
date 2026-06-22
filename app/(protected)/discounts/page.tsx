

import {Button} from "@/components/ui/button";
import Link from "next/link";
import { PageShell, PageHeader, PageBreadcrumbs, PageBody } from "@/components/layouts/page-shell";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import NoItems from "@/components/layouts/no-items";
import DataLoadError from "@/components/layouts/data-load-error";
import {DataTable} from "@/components/tables/data-table";
import {columns} from '@/components/tables/discount/column'
import { searchDiscount } from "@/lib/actions/discount-actions";
import { softFetch } from "@/lib/list-fallback";
import { Discount } from "@/types/discount/type";


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

     const responseData = await softFetch(searchDiscount(q,page,pageLimit));

     const data:Discount[]=responseData?.content ?? [];
     const total =responseData?.totalElements ?? 0;
     const pageCount = responseData?.totalPages ?? 0

    return (
        <PageShell>
            <PageBreadcrumbs items={[{ title: "Discounts" }]} />
            <PageHeader
                title="Discounts"
                subtitle="Manage discount in your business location"
                actions={
                    <Button>
                        <Link href={`/discounts/new`}>
                            Add Discount
                        </Link>
                    </Button>
                }
            />
            <PageBody>
                {
                    !responseData ? (
                        <DataLoadError itemName="discounts" />
                    ) : total > 0 || q != "" ? (
                        <Card x-chunk="data-table">
                            <CardHeader>
                                <CardTitle>Discount</CardTitle>
                                <CardDescription>Manage discount in your business location</CardDescription>
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
                            <NoItems newItemUrl={`/discounts/new`} itemName={`discounts`}/>
                        )
                }
            </PageBody>
        </PageShell>
    );
}

export default Page
