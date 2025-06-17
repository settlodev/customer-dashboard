import {Button} from "@/components/ui/button";
import Link from "next/link";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import NoItems from "@/components/layouts/no-items";
import {DataTable} from "@/components/tables/data-table";
import {columns} from '@/components/tables/addon/column'
import { searchAddon } from "@/lib/actions/addon-actions";
import { Addon } from "@/types/addon/type";

const breadCrumbItems = [{title:"Addons",link:"/addons"}];

// Updated type definition for Next.js 15
type Params = { 
    searchParams: Promise<{ 
        search?: string; 
        page?: string; 
        limit?: string; 
    }> 
};

async function AddonPage({searchParams}: Params) {
    // Await the searchParams promise
    const resolvedSearchParams = await searchParams;
    
    const q = resolvedSearchParams.search || "";
    const page = Number(resolvedSearchParams.page) || 0;
    const pageLimit = Number(resolvedSearchParams.limit);

    const responseData = await searchAddon(q, page, pageLimit);
    // console.log("Addon responseData:", responseData);

    const data: Addon[] = responseData.content;
    const total = responseData.totalElements;
    const pageCount = responseData.totalPages;

    return (
        <div className={`flex-1 space-y-4 md:p-8 pt-6 mt-10`}>
            <div className={`flex items-center justify-between mb-2`}>
                <div className={`relative flex-1 md:max-w-md`}>
                    <BreadcrumbsNav items={breadCrumbItems} />
                </div>
                <div className={`flex items-center space-x-2`}>
                    <Button>
                        <Link href={`/addons/new`}>
                            Add Addon
                        </Link>
                    </Button>
                </div>
            </div>
            {
                total > 0 || q != "" ? (
                    <Card x-chunk="data-table">
                        <CardHeader>
                            <CardTitle>Addon</CardTitle>
                            <CardDescription>Manage addons in your business location</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable 
                                columns={columns}
                                data={data}
                                searchKey="title"
                                pageNo={page}
                                total={total}
                                pageCount={pageCount}
                            />
                        </CardContent>
                    </Card>
                ) : (
                    <NoItems newItemUrl={`/addons/new`} itemName={`addons`}/>
                )
            }
        </div>
    );
}

export default AddonPage;