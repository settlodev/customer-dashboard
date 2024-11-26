import {ApiResponse} from "@/types/types";
import {UUID} from "node:crypto";
import {notFound} from "next/navigation";
import {isNotFoundError} from "next/dist/client/components/not-found";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { Modifier } from "@/types/modifiers/type";
import { getModifier } from "@/lib/actions/modifier-actions";
import ModifierForm from "@/components/forms/modifier_form";


export default async function ModifierPage({params}:{params:{id:string}}){

    const isNewItem = params.id === "new";
    let item: ApiResponse<Modifier> | null = null;

    if(!isNewItem){
        try{
            item = await  getModifier(params.id as UUID);
            if(item.totalElements == 0) notFound();
        }
        catch (error){
            if(isNotFoundError(error)) throw error;

            throw new Error("Failed to load modifiers details");
        }
    }

    const breadCrumbItems=[{title:"Modifiers",link:"/modifiers"},
        {title: isNewItem ? "New":item?.content[0].name || "Edit",link:""}]

    return(
        <div className={`flex-1 space-y-4 p-4 md:p-8 pt-6`}>
            <div className={`flex items-center justify-between mb-2`}>
                <div className={`relative flex-1 `}>
                    <BreadcrumbsNav items={breadCrumbItems}/>
                </div>
            </div>
            <ModifierCard isNewItem={isNewItem} item={item?.content[0]}/>
        </div>
    )
}

const ModifierCard =({isNewItem,item}:{
    isNewItem:boolean,
    item: Modifier | null | undefined
}) =>(
    <Card>
       <CardHeader>
           <CardTitle>
               {isNewItem ? "Add Modifier" : "Edit modifier details"}
           </CardTitle>
           <CardDescription>
               {isNewItem ? "Add modifier to your location": "Edit modifier details"}
           </CardDescription>
       </CardHeader>
        <CardContent>
            <ModifierForm item={item}/>
        </CardContent>
    </Card>
)
