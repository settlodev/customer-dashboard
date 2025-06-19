import {ApiResponse} from "@/types/types";
import {Customer} from "@/types/customer/type";
import {getCustomer} from "@/lib/actions/customer-actions";
import {UUID} from "node:crypto";
import {notFound} from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import CustomerForm from "@/components/forms/customer_form";

type Params = Promise<{id:string}>
export default async function CustomerPage({params}: {params: Params}){

    const resolvedParams = await params;
    const isNewItem = resolvedParams.id === "new";
    let item: ApiResponse<Customer> | null = null;

    if(!isNewItem){
        try{
            item = await  getCustomer(resolvedParams.id as UUID);
            if(item.totalElements == 0) notFound();
        }
        catch (error){
            console.log(error)
            throw new Error("Failed to load customer details");
        }
    }

    const breadCrumbItems=[{title:"Customer",link:"/customers"},
        {title: isNewItem ? "New":item?.content[0].firstName || "Edit",link:""}]

    return(
        <div className={`flex-1 space-y-4 p-4 md:p-8 pt-6`}>
            <div className={`flex items-center justify-between mb-2`}>
                <div className={`relative flex-1 `}>
                    <BreadcrumbsNav items={breadCrumbItems}/>
                </div>
            </div>
            <CustomerCard isNewItem={isNewItem} item={item?.content[0]}/>
        </div>
    )
}

const CustomerCard =({isNewItem,item}:{
    isNewItem:boolean,
    item: Customer | null | undefined
}) =>(
    <Card>
       <CardHeader>
           <CardTitle>
               {isNewItem ? "Add Customer" : "Edit customer details"}
           </CardTitle>
           <CardDescription>
               {isNewItem ? "Add customer to your business": "Edit customer details"}
           </CardDescription>
       </CardHeader>
        <CardContent>
            <CustomerForm item={item}/>
        </CardContent>
    </Card>
)
