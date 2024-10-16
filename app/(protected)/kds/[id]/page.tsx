import {ApiResponse} from "@/types/types";
import {UUID} from "node:crypto";
import {notFound} from "next/navigation";
import {isNotFoundError} from "next/dist/client/components/not-found";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { KDS } from "@/types/kds/type";
import { getKDS } from "@/lib/actions/kds-actions";
import KDSForm from "@/components/forms/kds_form";


export default async function KDSPage({params}:{params:{id:string}}){

    const isNewItem = params.id === "new";
    let item: ApiResponse<KDS> | null = null;

    if(!isNewItem){
        try{
            item = await  getKDS(params.id as UUID);
            if(item.totalElements == 0) notFound();
        }
        catch (error){
            if(isNotFoundError(error)) throw error;

            throw new Error("Failed to load KDS details");
        }
    }

    const breadCrumbItems=[{title:"KDS",link:"/kds"},
        {title: isNewItem ? "New":item?.content[0].name || "Edit",link:""}]

    return(
        <div className={`flex-1 space-y-4 p-4 md:p-8 pt-6`}>
            <div className={`flex items-center justify-between mb-2`}>
                <div className={`relative flex-1 `}>
                    <BreadcrumbsNav items={breadCrumbItems}/>
                </div>
            </div>
            <KDSCard isNewItem={isNewItem} item={item?.content[0]}/>
        </div>
    )
}

const KDSCard =({isNewItem,item}:{
    isNewItem:boolean,
    item: KDS | null | undefined
}) =>(
    <Card>
       <CardHeader>
           <CardTitle>
               {isNewItem ? "Add KDS" : "Edit KDS details"}
           </CardTitle>
           <CardDescription>
               {isNewItem ? "Add KDS to your business": "Edit KDS details"}
           </CardDescription>
       </CardHeader>
        <CardContent>
            <KDSForm item={item}/>
        </CardContent>
    </Card>
)
