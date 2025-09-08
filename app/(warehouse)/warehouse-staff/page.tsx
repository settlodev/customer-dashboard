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
import { columns } from "@/components/tables/warehouse/staff/columns";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Staff} from "@/types/staff";
import NoItems from "@/components/layouts/no-items";
import { searchStaffFromWarehouse } from "@/lib/actions/warehouse/staff-actions";

const breadcrumbItems = [{ title: "Staff", link: "/warehouse-staff" }];

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
    const pageLimit = Number(resolvedSearchParams.limit)

    const responseData = await searchStaffFromWarehouse(q, page, pageLimit);

    const data: Staff[] = responseData.content;
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
                        <Link key="add-space" href={`/warehouse-staff/new`}>
                            Add staff
                        </Link>
                    </Button>
                </div>
            </div>

            {total > 0 || q != "" ?
            (
                <Card x-chunk="data-table">
                    <CardHeader>
                        <CardTitle>Staff</CardTitle>
                        <CardDescription>Manage staff on your warehouse</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={columns}
                            data={data}
                            pageCount={pageCount}
                            pageNo={page}
                            searchKey="firstName"
                            total={total}
                        />
                    </CardContent>
                </Card>
            ) : (
                <NoItems itemName={`staff`} newItemUrl={`/staff/new`} />
            )}
        </div>
    );
}
