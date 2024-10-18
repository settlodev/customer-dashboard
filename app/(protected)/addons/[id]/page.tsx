import {ApiResponse} from "@/types/types";
import {UUID} from "node:crypto";
import {notFound} from "next/navigation";
import {isNotFoundError} from "next/dist/client/components/not-found";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { Addon } from "@/types/addon/type";
import { getAddon } from "@/lib/actions/addon-actions";
import AddonForm from "@/components/forms/addon_form";


export default async function AddonPage({params}:{params:{id:string}}){

    const isNewItem = params.id === "new";
    let item: ApiResponse<Addon> | null = null;

    if(!isNewItem){
        try{
            item = await  getAddon(params.id as UUID);
            if(item.totalElements == 0) notFound();
        }
        catch (error){
            if(isNotFoundError(error)) throw error;

            throw new Error("Failed to load addon details");
        }
    }

    const breadCrumbItems=[{title:"Addons",link:"/addons"},
        {title: isNewItem ? "New":item?.content[0].title || "Edit",link:""}]

    return(
        <div className={`flex-1 space-y-4 p-4 md:p-8 pt-6`}>
            <div className={`flex items-center justify-between mb-2`}>
                <div className={`relative flex-1 `}>
                    <BreadcrumbsNav items={breadCrumbItems}/>
                </div>
            </div>
            <AddonCard isNewItem={isNewItem} item={item?.content[0]}/>
        </div>
    )
}

const AddonCard =({isNewItem,item}:{
    isNewItem:boolean,
    item: Addon | null | undefined
}) =>(
    <Card>
       <CardHeader>
           <CardTitle>
               {isNewItem ? "Add Addon" : "Edit addon details"}
           </CardTitle>
           <CardDescription>
               {isNewItem ? "Add addon to your location": "Edit addon details"}
           </CardDescription>
       </CardHeader>
        <CardContent>
            <AddonForm item={item}/>
        </CardContent>
    </Card>
)
