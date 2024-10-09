import {ApiResponse} from "@/types/types";
import {Customer} from "@/types/customer/type";
import {getCustomer} from "@/lib/actions/customer-actions";
import {UUID} from "node:crypto";
import {notFound} from "next/navigation";
import {isNotFoundError} from "next/dist/client/components/not-found";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import CustomerForm from "@/components/forms/customer_form";
import { Discount } from "@/types/discount/type";
import { getDiscount } from "@/lib/actions/discount-actions";
import DiscountForm from "@/components/forms/discount_form";


export default async function DiscountPage({params}:{params:{id:string}}){

    const isNewItem = params.id === "new";
    let item: ApiResponse<Discount> | null = null;

    if(!isNewItem){
        try{
            item = await  getDiscount(params.id as UUID);
            if(item.totalElements == 0) notFound();
        }
        catch (error){
            if(isNotFoundError(error)) throw error;

            throw new Error("Failed to load discount details");
        }
    }

    const breadCrumbItems=[{title:"Discounts",link:"/discounts"},
        {title: isNewItem ? "New":item?.content[0].name || "Edit",link:""}]

    return(
        <div className={`flex-1 space-y-4 p-4 md:p-8 pt-6`}>
            <div className={`flex items-center justify-between mb-2`}>
                <div className={`relative flex-1 `}>
                    <BreadcrumbsNav items={breadCrumbItems}/>
                </div>
            </div>
            <DiscountCard isNewItem={isNewItem} item={item?.content[0]}/>
        </div>
    )
}

const DiscountCard =({isNewItem,item}:{
    isNewItem:boolean,
    item: Discount | null | undefined
}) =>(
    <Card>
       <CardHeader>
           <CardTitle>
               {isNewItem ? "Add Discount" : "Edit discount details"}
           </CardTitle>
           <CardDescription>
               {isNewItem ? "Add discount to your business": "Edit discount details"}
           </CardDescription>
       </CardHeader>
        <CardContent>
            <DiscountForm item={item}/>
        </CardContent>
    </Card>
)
