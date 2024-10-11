import {ApiResponse} from "@/types/types";
import {UUID} from "node:crypto";
import {notFound} from "next/navigation";
import {isNotFoundError} from "next/dist/client/components/not-found";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { Supplier } from "@/types/supplier/type";
import { getSupplier } from "@/lib/actions/supplier-actions";
import SupplierForm from "@/components/forms/supplier_form";


export default async function SupplierPage({params}:{params:{id:string}}){

    const isNewItem = params.id === "new";
    let item: ApiResponse<Supplier> | null = null;

    if(!isNewItem){
        try{
            item = await  getSupplier(params.id as UUID);
            if(item.totalElements == 0) notFound();
        }
        catch (error){
            if(isNotFoundError(error)) throw error;

            throw new Error("Failed to load supplier details");
        }
    }

    const breadCrumbItems=[{title:"Supplier",link:"/suppliers"},
        {title: isNewItem ? "New":item?.content[0].name || "Edit",link:""}]

    return(
        <div className={`flex-1 space-y-4 p-4 md:p-8 pt-6`}>
            <div className={`flex items-center justify-between mb-2`}>
                <div className={`relative flex-1 `}>
                    <BreadcrumbsNav items={breadCrumbItems}/>
                </div>
            </div>
            <SupplierCard isNewItem={isNewItem} item={item?.content[0]}/>
        </div>
    )
}

const SupplierCard =({isNewItem,item}:{
    isNewItem:boolean,
    item: Supplier | null | undefined
}) =>(
    <Card>
       <CardHeader>
           <CardTitle>
               {isNewItem ? "Add Supplier" : "Edit supplier details"}
           </CardTitle>
           <CardDescription>
               {isNewItem ? "Add supplier to your business": "Edit supplier details"}
           </CardDescription>
       </CardHeader>
        <CardContent>
            <SupplierForm item={item}/>
        </CardContent>
    </Card>
)
