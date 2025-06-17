import {ApiResponse} from "@/types/types";
import {UUID} from "node:crypto";
import {notFound} from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { Space } from "@/types/space/type";
import { getSpace } from "@/lib/actions/space-actions";
import SpaceForm from "@/components/forms/space_form";


type Params = Promise<{id:string}>
export default async function SpacePage({params}: {params: Params}){

    const resolvedParams = await params;
    const isNewItem = resolvedParams.id === "new";
    let item: ApiResponse<Space> | null = null;

    if(!isNewItem){
        try{
            item = await  getSpace(resolvedParams.id as UUID);
            if(item.totalElements == 0) notFound();
        }
        catch (error){
            console.log(error)
            throw new Error("Failed to load space details");
        }
    }

    const breadCrumbItems=[{title:"Spaces",link:"/spaces"},
        {title: isNewItem ? "New":item?.content[0].name || "Edit",link:""}]

    return(
        <div className={`flex-1 space-y-4 p-4 md:p-8 pt-6`}>
            <div className={`flex items-center justify-between mb-2`}>
                <div className={`relative flex-1 `}>
                    <BreadcrumbsNav items={breadCrumbItems}/>
                </div>
            </div>
            <SpaceCard isNewItem={isNewItem} item={item?.content[0]}/>
        </div>
    )
}

const SpaceCard =({isNewItem,item}:{
    isNewItem:boolean,
    item: Space | null | undefined
}) =>(
    <Card>
       <CardHeader>
           <CardTitle>
               {isNewItem ? "Add Table / Space" : "Edit table / space details"}
           </CardTitle>
           <CardDescription>
               {isNewItem ? "Add Table / Space to your business": "Edit table / space details"}
           </CardDescription>
       </CardHeader>
        <CardContent>
            <SpaceForm item={item}/>
        </CardContent>
    </Card>
)
