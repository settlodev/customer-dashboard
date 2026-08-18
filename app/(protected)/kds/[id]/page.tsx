import {ApiResponse} from "@/types/types";
import {UUID} from "node:crypto";
import {notFound} from "next/navigation";
import {
    PageShell,
    PageHeader,
    PageBreadcrumbs,
    PageBody,
} from "@/components/layouts/page-shell";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { KDS } from "@/types/kds/type";
import { getKDS } from "@/lib/actions/kds-actions";
import KDSForm from "@/components/forms/kds_form";


type Params = Promise<{id:string}>
export default async function KDSPage({params}: {params: Params}){

    const resolvedParams = await params;
    const isNewItem = resolvedParams.id === "new";
    let item: ApiResponse<KDS> | null = null;

    if(!isNewItem){
        try{
            item = await  getKDS(resolvedParams.id as UUID);
            if(item.totalElements == 0) notFound();
        }
        catch (error){
            console.log(error)
            throw new Error("Failed to load KDS details");
        }
    }

    const title = isNewItem ? "Add KDS" : item?.content[0].name || "Edit KDS details";

    return(
        <PageShell>
            <PageBreadcrumbs
                items={[
                    { title: "KDS", href: "/kds" },
                    { title: isNewItem ? "New" : item?.content[0].name || "Edit" },
                ]}
            />
            <PageHeader
                title={title}
                subtitle={isNewItem ? "Add KDS to your business" : "Edit KDS details"}
            />
            <PageBody>
                <KDSCard isNewItem={isNewItem} item={item?.content[0]}/>
            </PageBody>
        </PageShell>
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
