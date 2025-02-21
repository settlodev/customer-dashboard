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
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import NoItems from "@/components/layouts/no-items";
import { columns } from "@/components/tables/kds/columns";
import { searchKDS } from "@/lib/actions/kds-actions";

const breadcrumbItems = [{ title: "KDS", link: "/kds" }];

type ParamsProps = {
    searchParams: {
        [key: string]: string | undefined;
    };
};

export default async function Page({ searchParams }: ParamsProps) {
    const q = searchParams.search || "";
    const page = Number(searchParams.page) || 0;
    const pageLimit = Number(searchParams.limit);

    const responseData = await searchKDS(q, page, pageLimit);

    const data = responseData.content;
    const total = responseData.totalElements;
    const pageCount = responseData.totalPages;

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 mt-10">
            <div className="flex items-center justify-between mb-2">
                <div className="relative flex-1 md:max-w-md">
                    <BreadcrumbsNav items={breadcrumbItems} />
                </div>

                <div className="flex items-center space-x-2">
                    <Button>
                        <Link key="add-space" href={`/kds/new`}>Add KDS</Link>
                    </Button>
                </div>
            </div>

            {total > 0 || q != "" ? (
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
        </div>
    );
}
