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
import {columns} from "@/components/tables/campaign/columns";
import { searchCampaign} from "@/lib/actions/campaign_action";
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

    const responseData = await softFetch(searchCampaign(q, page, pageLimit));
    const data = responseData?.content ?? [];
    const total = responseData?.totalElements ?? 0;
    const pageCount = responseData?.totalPages ?? 0;

    return (
        <PageShell>
            <PageBreadcrumbs items={[{ title: "Campaign" }]} />
            <PageHeader
                title="Campaign"
                subtitle="List of all Campaign sent"
                actions={
                    <>
                        <Button>
                            <Link key="add-sms-email" href={`/campaigns/new`}>Send Campaign</Link>
                        </Button>
                    </>
                }
            />
            <PageBody>
            {!responseData ? (
                <DataLoadError itemName="campaigns" />
            ) : total > 0 || q != "" ? (
                <Card x-chunk="data-table">
                    <CardHeader>
                        <CardTitle>Campaigns Sent</CardTitle>
                        <CardDescription>List of all Campaign sent</CardDescription>
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
                <NoItems itemName={`campaign`} newItemUrl={`/campaigns/new`} />
            )}
            </PageBody>
        </PageShell>
    );
}
