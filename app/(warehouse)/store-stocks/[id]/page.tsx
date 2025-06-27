import {ApiResponse} from "@/types/types";
import {UUID} from "node:crypto";
import {notFound} from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { Stock } from "@/types/stock/type";
import { getStock } from "@/lib/actions/stock-actions";
import StockForm from "@/components/forms/stock_form";

type Params = Promise<{id: string}>
export default async function StockItemPage({params}: {params: Params}){

    const paramsData = await params
    const isNewItem = paramsData.id === "new";
    let item: ApiResponse<Stock> | null = null;

    if(!isNewItem){
        try{
            item = await  getStock(paramsData.id as UUID);
            if(item.totalElements == 0) notFound();
        }
        catch (error){
            
            console.log(error)
            throw new Error("Failed to load product details");
        }
    }

    const breadCrumbItems=[{title:"Stocks",link:"/stock-variants"},
        {title: isNewItem ? "New":item?.content[0].name || "Edit",link:""}]

    return(
        <div className={`flex-1 space-y-4 p-4 md:p-8 pt-6`}>
            <div className={`flex items-center justify-between mb-2`}>
                <div className={`relative flex-1 `}>
                    <BreadcrumbsNav items={breadCrumbItems}/>
                </div>
            </div>
            <StockCard isNewItem={isNewItem} item={item?.content[0]}/>
        </div>
    )
}

const StockCard =({isNewItem, item}:{
    isNewItem:boolean,
    item: Stock | null | undefined
}) =>(
    <Card>
       <CardHeader>
           <CardTitle>
               {isNewItem ? "Create Stock Item" : "Edit Stock Item"}
           </CardTitle>
           <CardDescription>
               {isNewItem ? "Create stock items to your business location": "Edit stock item details"}
           </CardDescription>
       </CardHeader>
        <CardContent>
            <StockForm item={item}/>
        </CardContent>
    </Card>
)
