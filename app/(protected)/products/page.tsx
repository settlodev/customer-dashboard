import {Button} from "@/components/ui/button";
import Link from "next/link";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import NoItems from "@/components/layouts/no-items";
import {DataTable} from "@/components/tables/data-table";
import {columns} from '@/components/tables/product/column'
import { Product } from "@/types/product/type";
import {searchProducts} from "@/lib/actions/product-actions";
import { ProductCSVDialog } from "@/components/csv/CSVImport";

const breadCrumbItems = [{title: "Products", link: "/products"}];
 type ParamsProps ={
     searchParams:{
         [key:string]:string | undefined
     }
 };
 async function Page({searchParams}:ParamsProps) {

     const q = searchParams.search || "";
     const page = Number(searchParams.page) || 0;
     const pageLimit = Number(searchParams.limit);

     const responseData = await searchProducts(q,page,pageLimit);
     
     const data:Product[]=responseData.content;
     const total =responseData.totalElements;
    //  console.log("Total is: ", total);
     const pageCount = responseData.totalPages

    return (
        <div className="flex-1 space-y-4 md:p-8 pt-6 mt-10">
            <div className="flex items-center justify-between mt-2 p-2">
                <div className="relative flex-1 md:max-w-md">
                    <BreadcrumbsNav items={breadCrumbItems} />
                </div>
                <div className={`flex items-center space-x-2`}>
                    <Button>
                        <Link href={`/products/new`}>Add Product</Link>
                    </Button>
                 {total === 0 && 
                 <div className="rounded">
                    <ProductCSVDialog />
                 </div>
                 }
                </div>
            </div>
            {
                total > 0 || q != "" ? (
                    <Card x-chunk="data-table">
                        <CardHeader>
                            <CardTitle>Product</CardTitle>
                            <CardDescription>Manage products in your business location</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable columns={columns}
                                       data={data}
                                       searchKey="name"
                                       pageNo={page}
                                       total={total}
                                       pageCount={pageCount}
                                //        filterKey="trackingInventory"
                                //        filterOptions={[
                                //         { label: "All", value: "" },
                                //    { label: "Out of Stock", value: "true" },
                                //    { label: "Low Stock", value: "false" },
                                //    {label: "Best selling", value: "false"}
                                //        ]}
                            />
                        </CardContent>
                    </Card>
                ):
                    (
                        <NoItems newItemUrl={`/products/new`} itemName={`products`}/>
                    )
            }
        </div>
    );
}

export default Page
