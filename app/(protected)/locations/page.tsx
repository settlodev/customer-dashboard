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
import {columns} from "@/app/(protected)/business/columns";
import {ApiResponse} from "@/types/types";
import {UUID} from "node:crypto";
import {notFound} from "next/navigation";
import {isNotFoundError} from "next/dist/client/components/not-found";
import {getBusiness} from "@/lib/actions/business/get";
import {Business} from "@/types/business/type";
import {listLocations} from "@/lib/actions/locations/list";

const breadcrumbItems = [{ title: "Businesses", link: "/businesses" }];

type ParamsProps = {
    searchParams: {
        [key: string]: string | undefined;
    };
};

export default async function BusinessPage(
    { searchParams }: ParamsProps
) {

    const breadcrumbItems = [
        { title: "Business", link: "/business" }
    ];

    console.log("Search params",searchParams)
    const q = searchParams.search || "";
    const page = Number(searchParams.page) || 0;
    const pageLimit = Number(searchParams.limit);

    const responseData = await listLocations(q, page, pageLimit, );
    //console.log("Business responseData:", responseData);

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
                        <Link key="add-space" href={`/business/create`}>Add Location</Link>
                    </Button>
                </div>
            </div>

            {/*{total > 0 || q != "" ? (
                <Card x-chunk="data-table">
                    <CardHeader>
                        <CardTitle>Business</CardTitle>
                        <CardDescription>Manage your businesses</CardDescription>
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
                <NoItems itemName={`businesses`} newItemUrl={`/businesses/create`} />
            )}*/}
        </div>
    );
}
