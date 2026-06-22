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
import { Discount } from "@/types/discount/type";
import { getDiscount } from "@/lib/actions/discount-actions";
import DiscountForm from "@/components/forms/discount_form";

type Params = Promise<{id: string}>
export default async function DiscountPage({params}: {params: Params}){

    const resolvedParams = await params;
    const isNewItem = resolvedParams.id === "new";
    let item: ApiResponse<Discount> | null = null;

    if(!isNewItem){
        try{
            item = await  getDiscount(resolvedParams.id as UUID);
            if(item.totalElements == 0) notFound();
        }
        catch (error){
            console.log(error)
            throw new Error("Failed to load discount details");
        }
    }

    const title = isNewItem ? "Add Discount" : item?.content[0].name || "Edit discount details";

    return(
        <PageShell>
            <PageBreadcrumbs
                items={[
                    { title: "Discounts", href: "/discounts" },
                    { title: isNewItem ? "New" : item?.content[0].name || "Edit" },
                ]}
            />
            <PageHeader
                title={title}
                subtitle={isNewItem ? "Add discount to your business" : "Edit discount details"}
            />
            <PageBody>
                <DiscountCard isNewItem={isNewItem} item={item?.content[0]}/>
            </PageBody>
        </PageShell>
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
