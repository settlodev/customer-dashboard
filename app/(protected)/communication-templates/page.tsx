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
import {columns} from "@/components/tables/communication-templates/columns";
import { searchTemplates } from "@/lib/actions/communication-templates-actions";

const breadcrumbItems = [{ title: "Communication Templates", link: "/communication-templates" }];

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

    const responseData = await searchTemplates(q, page, pageLimit);
    const data = responseData.content;
    const total = responseData.totalElements;
    const pageCount = responseData.totalPages;

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between mb-2">
                <div className="relative flex-1 md:max-w-md">
                    <BreadcrumbsNav items={breadcrumbItems} />
                </div>

                <div className="flex items-center space-x-2">
                    <Button>
                        <Link key="add-reservation" href={`/communication-templates/new`}>Add Template</Link>
                    </Button>
                </div>
            </div>

            {total > 0 || q != "" ? (
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
        </div>
    );
}
