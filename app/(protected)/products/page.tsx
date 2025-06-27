import {Button} from "@/components/ui/button";
import Link from "next/link";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import NoItems from "@/components/layouts/no-items";
import {DataTable} from "@/components/tables/data-table";
import {columns} from '@/components/tables/product/column'
import { Product } from "@/types/product/type";
import {productSummary, searchProducts} from "@/lib/actions/product-actions";
import { ProductCSVDialog } from "@/components/csv/CSVImport";
import { Plus } from "lucide-react";
import ProductSummary from "@/components/widgets/products/product-summary";

const breadCrumbItems = [{title: "Products", link: "/products"}];

type Params = { 
    searchParams: Promise<{ 
        search?: string; 
        page?: string; 
        limit?: string; 
    }> 
};

async function Page({searchParams}: Params) {
    
    const resolvedSearchParams = await searchParams;
    
    const q = resolvedSearchParams.search || "";
    const page = Number(resolvedSearchParams.page) || 0;
    const pageLimit = Number(resolvedSearchParams.limit);

    // Fetch both data sets in parallel
    const [responseData, summaryData] = await Promise.all([
        searchProducts(q, page, pageLimit),
        productSummary()
    ]);
    
    // Filter out archived products
    const filteredData: Product[] = responseData.content.filter(product => !product.isArchived);
    
    const total = responseData.totalElements;
    const pageCount = responseData.totalPages;

    return (
        <div className="flex-1 space-y-4 md:p-8 pt-6 mt-10">
            <div className="flex items-center justify-between mt-2 p-2">
                <div className="relative flex-1 md:max-w-md">
                    <BreadcrumbsNav items={breadCrumbItems} />
                </div>
                <div className={`flex items-center space-x-2`}>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        <Link href={`/products/new`}>Add Product</Link>
                    </Button>
                    {total === 0 && 
                    <div className="rounded">
                        <ProductCSVDialog />
                    </div>
                    }
                </div>
            </div>
            <div className="flex flex-col gap-2 p-3 border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <h2 className="text-lg font-semibold">Product Summary</h2>
                <ProductSummary data={summaryData}/>
            </div>
            {
                total > 0 || q != "" ? (
                    <Card x-chunk="data-table">
                        <CardHeader>
                            <CardTitle>Product</CardTitle>
                            <CardDescription>Manage products in your business location</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable 
                                columns={columns}
                                data={filteredData}
                                searchKey="name"
                                pageNo={page}
                                total={total}
                                pageCount={pageCount}
                            />
                        </CardContent>
                    </Card>
                ) : (
                    <NoItems newItemUrl={`/products/new`} itemName={`products`}/>
                )
            }
        </div>
    );
}

export default Page