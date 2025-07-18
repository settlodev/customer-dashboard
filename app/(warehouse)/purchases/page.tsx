
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import NoItems from "@/components/layouts/no-items";
import {columns} from "@/components/tables/warehouse/purchase/columns";
import { searchStockIntakePurchases } from "@/lib/actions/warehouse/purchases-action";
import { DataTable } from "@/components/tables/data-table";

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
    const page = Number(resolvedSearchParams.page) || 0;
    const pageLimit = Number(resolvedSearchParams.limit);

    const responseData = await searchStockIntakePurchases(q, page, pageLimit);
    const data = responseData.content;
    const total = responseData.totalElements || 0;
    const pageCount = responseData.totalPages;

  

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 mt-10">
            <div className="flex items-center justify-between mb-2">
                <div className="relative flex-1 md:max-w-md">
                    <BreadcrumbsNav items={breadcrumbItems} />
                </div>

            </div>

            {total > 0 || q != "" ? (
                <Card x-chunk="data-table">
                    <CardHeader>
                        <CardTitle>Stock Intake Purchases</CardTitle>
                        <CardDescription>
                            List of Stock Intake Purchases
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={columns}
                            data={data}
                            pageCount={pageCount}
                            pageNo={page}
                            searchKey="stockVariantName"
                            total={total}
                        />
                    </CardContent>
                </Card>
            ) : (
                <NoItems itemName={`Purchase`} newItemUrl={`/purchases/new`} />
            )}
        </div>
    );
}
