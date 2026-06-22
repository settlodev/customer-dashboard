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
import {
    PageShell,
    PageHeader,
    PageBreadcrumbs,
    PageBody,
} from "@/components/layouts/page-shell";
import NoItems from "@/components/layouts/no-items";
import DataLoadError from "@/components/layouts/data-load-error";
import {columns} from "@/components/tables/communication-templates/columns";
import { searchTemplates } from "@/lib/actions/communication-templates-actions";
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

    const responseData = await softFetch(searchTemplates(q, page, pageLimit));
    const data = responseData?.content ?? [];
    const total = responseData?.totalElements ?? 0;
    const pageCount = responseData?.totalPages ?? 0;

    return (
        <PageShell>
            <PageBreadcrumbs items={[{ title: "Communication Templates" }]} />
            <PageHeader
                title="Communication Templates"
                subtitle="Manage communication in your business location by creating templates"
                actions={
                    <>
                        <Button>
                            <Link key="add-reservation" href={`/communication-templates/new`}>Add Template</Link>
                        </Button>
                    </>
                }
            />
            <PageBody>
            {!responseData ? (
                <DataLoadError itemName="communication templates" />
            ) : total > 0 || q != "" ? (
                <Card x-chunk="data-table">
                    <CardHeader>
                        <CardTitle>Communication Templates</CardTitle>
                        <CardDescription>Manage communication in your business location by creating templates</CardDescription>
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
                <NoItems itemName={`Communication Templates`} newItemUrl={`/communication-templates/new`} />
            )}
            </PageBody>
        </PageShell>
    );
}
