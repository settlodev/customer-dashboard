

import {Button} from "@/components/ui/button";
import Link from "next/link";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {searchCustomer} from "@/lib/actions/customer-actions";
import {Customer} from "@/types/customer/type";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import NoItems from "@/components/layouts/no-items";
import {DataTable} from "@/components/tables/data-table";
import {columns} from '@/components/tables/customer/column'


const breadCrumbItems = [{title:"Customers",link:"/customers"}];
 type ParamsProps ={
     searchParams:{
         [key:string]:string | undefined
     }
 };
 async function CustomersPage({searchParams}:ParamsProps) {

     const q = searchParams.search || "";
     const page = Number(searchParams.page) || 0;
     const pageLimit = Number(searchParams.limit);

     const responseData = await searchCustomer(q,page,pageLimit);

     const data:Customer[]=responseData.content;
     console.log("Customer data fetched from search response",data)
     const total =responseData.totalElements;
     const pageCount = responseData.totalPages

    return (
        <div className={`flex-1 space-y-4 md:p-8 pt-6`}>
            <div className={`flex items-center justify-between mb-2`}>
                <div className={`relative flex-1 md:max-w-md`}>
                    <BreadcrumbsNav items={breadCrumbItems} />
                </div>
                <div className={`flex items-center space-x-2`}>
                    <Button>
                        <Link href={`/customers/new`}>
                            Add Customer
                        </Link>
                    </Button>
                </div>
            </div>
            {
                total > 0 || q != "" ? (
                    <Card x-chunk="data-table">
                        <CardHeader>
                            <CardTitle>Customer</CardTitle>
                            <CardDescription>Manage customer in your business location</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable columns={columns}
                                       data={data}
                                       searchKey="firstName"
                                       pageNo={page}
                                       total={total}
                                       pageCount={pageCount}
                            />
                        </CardContent>
                    </Card>
                ):
                    (
                        <NoItems newItemUrl={`/customers/new`} itemName={`customers`}/>
                    )
            }
        </div>
    );
}

export default CustomersPage
