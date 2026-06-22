import Link from "next/link";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { PageShell, PageHeader, PageBreadcrumbs, PageBody } from "@/components/layouts/page-shell";
import NoItems from "@/components/layouts/no-items";
import DataLoadError from "@/components/layouts/data-load-error";
import { columns } from "@/components/tables/kds/columns";
import { searchKDS } from "@/lib/actions/kds-actions";
import { softFetch } from "@/lib/list-fallback";

type Params = {
    searchParams: Promise<{
        search?: string;
        page?: string;
        limit?: string;
    }>
};

export default async function Page({ searchParams }: Params) {
    const resolvedSearchParams = await searchParams;

    const q = resolvedSearchParams.search || "";
    const page = Number(resolvedSearchParams.page) || 0;
    const pageLimit = Number(resolvedSearchParams.limit);

    const responseData = await softFetch(searchKDS(q, page, pageLimit));

    const data = responseData?.content ?? [];
    const total = responseData?.totalElements ?? 0;
    const pageCount = responseData?.totalPages ?? 0;

    return (
        <PageShell>
            <PageBreadcrumbs items={[{ title: "KDS" }]} />
            <PageHeader
                title="KDS"
                subtitle="Manage KDS in your business location"
                actions={
                    <Button>
                        <Link key="add-space" href={`/kds/new`}>Add KDS</Link>
                    </Button>
                }
            />
            <PageBody>
                {!responseData ? (
                    <DataLoadError itemName="KDS" />
                ) : total > 0 || q != "" ? (
                    <Card x-chunk="data-table">
                        <CardHeader>
                            <CardTitle>KDS</CardTitle>
                            <CardDescription>Manage KDS in your business location</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                columns={columns}
                                data={data}
                                pageCount={pageCount}
                                pageNo={page}
                                searchKey="name"
                                total={total}
                            />
                        </CardContent>
                    </Card>
                ) : (
                    <NoItems itemName={`KDS`} newItemUrl={`/kds/new`} />
                )}
            </PageBody>
        </PageShell>
    );
}
