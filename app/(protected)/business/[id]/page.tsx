import Link from "next/link";

import { Button } from "@/components/ui/button";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {ApiResponse} from "@/types/types";
import {UUID} from "node:crypto";
import {notFound} from "next/navigation";
import {isNotFoundError} from "next/dist/client/components/not-found";
import {getBusiness} from "@/lib/actions/business/get";
import {Business} from "@/types/business/type";

export default async function BusinessPage(
    { params }: { params: { id: string }}
) {

    const isNewItem = params.id === "new";
    let item: ApiResponse<Business> | null = null;

    if (!isNewItem) {
        try {
            item = await getBusiness(params.id as UUID);
            if (item.totalElements == 0) notFound();
        } catch (error) {
            // Ignore redirect error
            if (isNotFoundError(error)) throw error;

            throw new Error("Failed to load data");
        }
    }
    console.log("item is now: ", item);

    const breadcrumbItems = [
        { title: "Business", link: "/business" },
        {
            title: isNewItem ? "New" : item?.content[0]?.name || "Edit",
            link: "",
        },
    ];

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
