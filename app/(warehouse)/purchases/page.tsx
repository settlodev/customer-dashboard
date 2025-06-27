import Link from "next/link";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { DataTable } from "@/components/tables/data-table";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import NoItems from "@/components/layouts/no-items";
// import {columns} from "@/components/tables/warehouse/purchase/columns";
// import { searchPurchases } from "@/lib/actions/warehouse/purchases-action";
import { Plus } from "lucide-react";

const breadcrumbItems = [{ title: "Purchase", link: "/purchases" }];

type Params = { 
    searchParams: Promise<{ 
        search?: string; 
        page?: string; 
        limit?: string; 
    }> 
};

export default async function Page({searchParams}:Params) {
    const resolvedSearchParams = await searchParams;
    
    const q = resolvedSearchParams.search || "";
    // const page = Number(resolvedSearchParams.page) || 0;
    // const pageLimit = Number(resolvedSearchParams.limit);

    // const responseData = await searchPurchases(q, page, pageLimit);
    // const data = responseData.content;
    // const total = responseData.totalElements || 0;
    // const pageCount = responseData.totalPages;

    const total= 0

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 mt-10">
            <div className="flex items-center justify-between mb-2">
                <div className="relative flex-1 md:max-w-md">
                    <BreadcrumbsNav items={breadcrumbItems} />
                </div>

                <div className="flex items-center space-x-2">
                    
                    <Button className="">
                    <Plus className="mr-2 h-4 w-4" color="#A3FFD6"/>
                        <Link key="add-category" href={`/purchases/new`}>New Purchase Order</Link>
                    </Button>
                </div>
            </div>

            {total > 0 || q != "" ? (
                <Card x-chunk="data-table">
                    <CardHeader>
                        <CardTitle>Purchase History</CardTitle>
                        {/* <CardDescription>Manage categories in your business location</CardDescription> */}
                    </CardHeader>
                    <CardContent>
                        {/* <DataTable
                            columns={columns}
                            data={data}
                            pageCount={pageCount}
                            pageNo={page}
                            searchKey="name"
                            total={total}
                        /> */}
                    </CardContent>
                </Card>
            ) : (
                <NoItems itemName={`Purchase`} newItemUrl={`/purchases/new`} />
            )}
        </div>
    );
}
