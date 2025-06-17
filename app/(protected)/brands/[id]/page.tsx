import {ApiResponse} from "@/types/types";
import {UUID} from "node:crypto";
import {notFound} from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { Brand } from "@/types/brand/type";
import { getBrand } from "@/lib/actions/brand-actions";
import BrandForm from "@/components/forms/brand_form";

type Params = Promise<{id:string}>
export default async function BrandPage({params}: {params: Params}){

    const resolvedParams = await params;
    const isNewItem = resolvedParams.id === "new";
    let item: ApiResponse<Brand> | null = null;

    if(!isNewItem){
        try{
            item = await  getBrand(resolvedParams.id as UUID);
            if(item.totalElements == 0) notFound();
        }
        catch (error){
            console.log(error)
            throw new Error("Failed to load brand details");
        }
    }

    const breadCrumbItems=[{title:"Brands",link:"/brands"},
        {title: isNewItem ? "New":item?.content[0].name || "Edit",link:""}]

    return(
        <div className={`flex-1 space-y-4 p-4 md:p-8 pt-6`}>
            <div className={`flex items-center justify-between mb-2`}>
                <div className={`relative flex-1 `}>
                    <BreadcrumbsNav items={breadCrumbItems}/>
                </div>
            </div>
            <BrandCard isNewItem={isNewItem} item={item?.content[0]}/>
        </div>
    )
}

const BrandCard =({isNewItem,item}:{
    isNewItem:boolean,
    item: Brand | null | undefined
}) =>(
    <Card>
       <CardHeader>
           <CardTitle>
               {isNewItem ? "Add Brand" : "Edit brand details"}
           </CardTitle>
           <CardDescription>
               {isNewItem ? "Add brand to your business": "Edit brand details"}
           </CardDescription>
       </CardHeader>
        <CardContent>
            <BrandForm item={item}/>
        </CardContent>
    </Card>
)
